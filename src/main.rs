#![cfg(not(target_arch = "wasm32"))]

mod data;
mod rules;
mod transform_rules;
mod worldgen;

use data::game_desc::GameDesc;
use futures_util::lock::Mutex;
use futures_util::{future, SinkExt, StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, AtomicI32, Ordering};
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::mpsc;
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::Message;
use transform_rules::Rules;
use worldgen::galaxy_gen::{create_galaxy, find_stars};

#[tokio::main(worker_threads = 32)] // Increase worker thread pool size
async fn main() -> Result<(), std::io::Error> {
    println!("Starting...");
    println!("Available parallelism: {:?}", std::thread::available_parallelism());
    let listener = TcpListener::bind("127.0.0.1:62879").await?;
    println!("Started.");
    println!("You may now turn on native mode to search.");
    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(accept_connection(stream));
    }
    Ok(())
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum IncomingMessage {
    Generate {
        game: GameDesc,
    },
    Find {
        game: GameDesc,
        rule: Rules,
        range: (i32, i32),
        concurrency: i32,
        autosave: u64,
    },
    Stop,
}

#[derive(Serialize)]
#[serde(tag = "type")]
enum OutgoingMessage {
    Result { seed: i32, indexes: Vec<usize> },
    Progress { start: i32, end: i32 },
    Done { start: i32, end: i32 },
}

// Internal message for worker threads to communicate with WebSocket handler
#[derive(Debug, Clone)]
enum WorkerMessage {
    Result { seed: i32, indexes: Vec<usize> },
    Progress { seeds_completed: Vec<i32> },
    Finished,
}

struct FindState {
    pub progress_start: i32,
    pub progress_end: i32,
    pub pending_seeds: HashSet<i32>,
    pub running: i32,
    pub autosave: u64,
    pub last_notify: SystemTime,
}

impl FindState {
    pub fn add_batch(&mut self, seeds: Vec<i32>) -> Option<(i32, i32)> {
        let mut notify = false;
        
        for seed in seeds {
            if self.progress_end == seed {
                self.progress_end += 1;
                let mut e = self.progress_end;
                while self.pending_seeds.remove(&e) {
                    e += 1;
                }
                self.progress_end = e;
            } else {
                self.pending_seeds.insert(seed);
            }
        }
        
        let now = SystemTime::now();
        if now.duration_since(self.last_notify).unwrap().as_secs() >= self.autosave {
            self.last_notify = now;
            let start = self.progress_start;
            self.progress_start = self.progress_end;
            notify = true;
        }
        
        if notify {
            Some((self.progress_start, self.progress_end))
        } else {
            None
        }
    }
}

async fn accept_connection(stream: TcpStream) {
    let ws_stream = accept_async(stream)
        .await
        .expect("Error during websocket handshake");
    let (write, read) = ws_stream.split();

    let write = Arc::new(Mutex::new(write));
    let stopped = Arc::new(AtomicBool::new(false));

    let _ = read
        .try_for_each(|msg| {
            if !msg.is_empty() {
                let msg: IncomingMessage = serde_json::from_str(&msg.to_string()).unwrap();
                match msg {
                    IncomingMessage::Stop => {
                        println!("Stopping");
                        stopped.store(true, Ordering::SeqCst);
                    }
                    IncomingMessage::Generate { game } => {
                        let galaxy = create_galaxy(&game);
                        let output = serde_json::to_string(&galaxy).unwrap();
                        let _ = write.lock().await.send(Message::Text(output)).await;
                    }
                    IncomingMessage::Find {
                        game,
                        rule,
                        range: (start, end),
                        concurrency,
                        autosave,
                    } => {
                        println!("Receive search request.");
                        println!("Concurrency: {}.", concurrency);
                        let threads = concurrency.min(end - start);
                        
                        // Create channel for worker communication
                        let (worker_tx, mut worker_rx) = mpsc::unbounded_channel::<WorkerMessage>();
                        
                        // Start workers
                        let current_seed = Arc::new(AtomicI32::new(start));
                        stopped.store(false, Ordering::SeqCst);
                        
                        for _ in 0..threads {
                            let tx = worker_tx.clone();
                            let mut transformed = transform_rules::transform_rules(rule.clone());
                            let mut g = game.clone();
                            let cs = current_seed.clone();
                            let stop = stopped.clone();
                            
                            std::thread::spawn(move || {
                                const BATCH_SIZE: usize = 10; // Process seeds in batches
                                let mut completed_seeds = Vec::with_capacity(BATCH_SIZE);
                                
                                loop {
                                    // Get next seed
                                    let seed = cs.fetch_add(1, Ordering::SeqCst);
                                    if seed >= end || stop.load(Ordering::SeqCst) {
                                        break;
                                    }
                                    
                                    // Process seed
                                    g.seed = seed;
                                    let star_indexes = find_stars(&g, &mut transformed);
                                    
                                    // Send result if found
                                    if !star_indexes.is_empty() {
                                        let _ = tx.send(WorkerMessage::Result { seed, indexes: star_indexes });
                                    }
                                    
                                    // Batch progress updates
                                    completed_seeds.push(seed);
                                    if completed_seeds.len() >= BATCH_SIZE {
                                        let _ = tx.send(WorkerMessage::Progress { 
                                            seeds_completed: completed_seeds.clone() 
                                        });
                                        completed_seeds.clear();
                                    }
                                }
                                
                                // Send remaining progress
                                if !completed_seeds.is_empty() {
                                    let _ = tx.send(WorkerMessage::Progress { 
                                        seeds_completed: completed_seeds 
                                    });
                                }
                                
                                let _ = tx.send(WorkerMessage::Finished);
                            });
                        }
                        
                        // Drop the original sender so the channel closes when all workers finish
                        drop(worker_tx);
                        
                        // Handle worker messages
                        let state = Arc::new(std::sync::Mutex::new(FindState {
                            progress_end: start,
                            progress_start: start,
                            running: threads,
                            pending_seeds: HashSet::new(),
                            autosave,
                            last_notify: SystemTime::now(),
                        }));
                        
                        let write_clone = write.clone();
                        tokio::spawn(async move {
                            let mut finished_workers = 0;
                            
                            while let Some(worker_msg) = worker_rx.recv().await {
                                match worker_msg {
                                    WorkerMessage::Result { seed, indexes } => {
                                        let output = serde_json::to_string(&OutgoingMessage::Result {
                                            seed,
                                            indexes,
                                        }).unwrap();
                                        let _ = write_clone.lock().await.send(Message::Text(output)).await;
                                    }
                                    WorkerMessage::Progress { seeds_completed } => {
                                        let notify_progress = {
                                            let mut s = state.lock().unwrap();
                                            s.add_batch(seeds_completed)
                                        };
                                        
                                        if let Some((start, end)) = notify_progress {
                                            println!("Processing: {}.", end);
                                            let output = serde_json::to_string(&OutgoingMessage::Progress {
                                                start,
                                                end,
                                            }).unwrap();
                                            let _ = write_clone.lock().await.send(Message::Text(output)).await;
                                        }
                                    }
                                    WorkerMessage::Finished => {
                                        finished_workers += 1;
                                        if finished_workers >= threads {
                                            let (progress_start, progress_end) = {
                                                let s = state.lock().unwrap();
                                                (s.progress_start, s.progress_end)
                                            };
                                            println!("Completed: {}.", progress_end);
                                            let output = serde_json::to_string(&OutgoingMessage::Done {
                                                start: progress_start,
                                                end: progress_end,
                                            }).unwrap();
                                            let _ = write_clone.lock().await.send(Message::Text(output)).await;
                                            break;
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            }
            future::ok(())
        })
        .await;
}
