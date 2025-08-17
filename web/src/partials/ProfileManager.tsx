import { Component, Show, createSignal } from "solid-js"
import styles from "./ProfileManager.module.css"
import Button from "../components/Button"
import Modal from "../components/Modal"

const ProfileManager: Component<{
    onLoad: () => void
    onSave: () => void
    onNew: () => void
    onClone: () => void
    onClear: () => void
    onDelete: () => void
    disabled: boolean
    isLoaded: boolean
    isValid: boolean
}> = (props) => {
    const [clearModal, setClearModal] = createSignal(false)
    const [deleteModal, setDeleteModal] = createSignal(false)
    const [newModal, setNewModal] = createSignal(false)

    return (
        <div class={styles.top}>
            配置：
            <Button onClick={props.onLoad} disabled={props.disabled}>
                加载
            </Button>
            <Button
                onClick={props.onSave}
                disabled={props.disabled || !props.isValid}
            >
                保存
            </Button>
            <Show when={props.isLoaded}>
                <Button
                    onClick={() => setNewModal(true)}
                    disabled={props.disabled}
                >
                    新建
                </Button>
                <Button onClick={props.onClone} disabled={props.disabled}>
                    复制
                </Button>
                <Button
                    theme="error"
                    onClick={() => setClearModal(true)}
                    disabled={props.disabled}
                >
                    清空
                </Button>
                <Button
                    theme="error"
                    onClick={() => setDeleteModal(true)}
                    disabled={props.disabled}
                >
                    删除
                </Button>
            </Show>
            <Modal
                visible={clearModal()}
                onClose={() => setClearModal(false)}
                backdropDismiss
            >
                <div class={styles.modalTitle}>确认操作</div>
                <div class={styles.warnText}>
                    您确定要清空所有进度吗？此操作无法撤销。
                </div>
                <div class={styles.warnButtons}>
                    <Button
                        theme="error"
                        onClick={() => {
                            setClearModal(false)
                            props.onClear()
                        }}
                    >
                        清空
                    </Button>
                    <Button kind="outline" onClick={() => setClearModal(false)}>
                        取消
                    </Button>
                </div>
            </Modal>
            <Modal
                visible={deleteModal()}
                onClose={() => setDeleteModal(false)}
                backdropDismiss
            >
                <div class={styles.modalTitle}>确认操作</div>
                <div class={styles.warnText}>
                    您确定要删除所有设置和进度吗？此操作无法撤销。
                </div>
                <div class={styles.warnButtons}>
                    <Button
                        theme="error"
                        onClick={() => {
                            setDeleteModal(false)
                            props.onDelete()
                        }}
                    >
                        删除
                    </Button>
                    <Button
                        kind="outline"
                        onClick={() => setDeleteModal(false)}
                    >
                        取消
                    </Button>
                </div>
            </Modal>
            <Modal
                visible={newModal()}
                onClose={() => setNewModal(false)}
                backdropDismiss
            >
                <div class={styles.modalTitle}>确认操作</div>
                <div class={styles.warnText}>
                    您确定要创建新配置吗？所有未保存的更改将丢失。
                </div>
                <div class={styles.warnButtons}>
                    <Button
                        onClick={() => {
                            setNewModal(false)
                            props.onNew()
                        }}
                    >
                        确认
                    </Button>
                    <Button kind="outline" onClick={() => setNewModal(false)}>
                        取消
                    </Button>
                </div>
            </Modal>
        </div>
    )
}

export default ProfileManager
