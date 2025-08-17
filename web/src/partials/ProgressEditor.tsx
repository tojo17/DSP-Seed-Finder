import { JSX } from "solid-js"
import Input from "../components/Input"
import styles from "./ProgressEditor.module.css"
import StarCountSelector from "./StarCountSelector"
import Tooltip from "../components/Tooltip"
import Toggle from "../components/Toggle"
import ExeUrl from "../../../target/release/dsp_seed.exe?url"
import Button from "../components/Button"
import ResourceMultiplierSelector from "./ResourceMultiplerSelector"
import NumberInput from "../components/NumberInput"

function ProgressEditor<E extends ProfileProgressInfo>(props: {
    progress: E
    onProgressChange: <K extends keyof E>(key: K, v: E[K]) => void
    name: string
    onNameChange: (v: string) => void
    nativeMode: boolean
    onNativeModeChange: (v: boolean) => void
    isLoaded: boolean
    searching: boolean
}): JSX.Element {
    const hasProgress = () =>
        props.progress.start > -1 &&
        props.progress.current > props.progress.start
    const isDisabled = () => props.searching || hasProgress()

    return (
        <div class={styles.fields}>
            <div class={styles.field}>
                <div class={styles.label}>
                    {props.isLoaded ? "" : "新"}方案名称
                </div>
                <div class={styles.input}>
                    <Input
                        value={props.name}
                        onChange={props.onNameChange}
                        error={props.name === ""}
                        disabled={props.searching}
                    />
                </div>
            </div>
            <div />
            <div class={styles.field}>
                <div class={styles.label}>恒星数量</div>
                <div class={styles.input}>
                    <StarCountSelector
                        class={styles.inputStandard}
                        value={props.progress.starCount}
                        onChange={(value) =>
                            props.onProgressChange("starCount", value)
                        }
                        disabled={isDisabled()}
                    />
                </div>
            </div>
            <div class={styles.field}>
                <div class={styles.label}>
                    <Tooltip text="要在（更快的）本机模式下运行搜索，请点击下载按钮并在您的电脑上运行程序，然后启用此选项。">
                        本机模式
                    </Tooltip>
                </div>
                <div class={styles.input}>
                    <Toggle
                        value={props.nativeMode}
                        onChange={props.onNativeModeChange}
                        disabled={props.searching}
                    />
                    <a href={ExeUrl} download>
                        <Button kind="outline">下载</Button>
                    </a>
                </div>
            </div>
            <div class={styles.field}>
                <div class={styles.label}>资源倍率</div>
                <div class={styles.input}>
                    <ResourceMultiplierSelector
                        class={styles.inputStandard}
                        value={props.progress.resourceMultiplier}
                        onChange={(value) =>
                            props.onProgressChange("resourceMultiplier", value)
                        }
                        disabled={isDisabled()}
                    />
                </div>
            </div>
            <div class={styles.field}>
                <div class={styles.label}>
                    <Tooltip text="运行搜索的并行进程数。">
                        并发数
                    </Tooltip>
                </div>
                <div class={styles.input}>
                    <NumberInput
                        class={styles.inputStandard}
                        value={props.progress.concurrency}
                        onChange={(value) =>
                            props.onProgressChange("concurrency", value)
                        }
                        emptyValue={-1}
                        maxLength={2}
                        error={
                            !Number.isInteger(props.progress.concurrency) ||
                            props.progress.concurrency < 1
                        }
                        disabled={props.searching}
                    />
                </div>
            </div>
            <div class={styles.field}>
                <div class={styles.label}>种子范围</div>
                <div class={styles.input}>
                    <NumberInput
                        class={styles.inputSeed}
                        value={props.progress.start}
                        onChange={(value) =>
                            props.onProgressChange("start", value)
                        }
                        emptyValue={-1}
                        maxLength={8}
                        error={
                            props.progress.start < 0 ||
                            props.progress.start >= props.progress.end
                        }
                        disabled={isDisabled()}
                    />{" "}
                    到{" "}
                    <NumberInput
                        class={styles.inputSeed}
                        value={props.progress.end - 1}
                        onChange={(value) =>
                            props.onProgressChange("end", value + 1)
                        }
                        emptyValue={-1}
                        maxLength={8}
                        error={
                            props.progress.end > 1e8 ||
                            props.progress.start >= props.progress.end
                        }
                        disabled={isDisabled()}
                    />
                </div>
            </div>
            <div class={styles.field}>
                <div class={styles.label}>
                    <Tooltip text="频繁运行自动保存可能会降低搜索性能。">
                        自动保存间隔
                    </Tooltip>
                </div>
                <div class={styles.input}>
                    每{" "}
                    <NumberInput
                        class={styles.inputSmall}
                        value={props.progress.autosave}
                        onChange={(value) =>
                            props.onProgressChange("autosave", value)
                        }
                        emptyValue={-1}
                        error={props.progress.autosave <= 0}
                        disabled={props.searching}
                    />{" "}
                    秒
                </div>
            </div>
        </div>
    )
}

export default ProgressEditor
