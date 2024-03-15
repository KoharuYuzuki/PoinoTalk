import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance } from './storage'
import { dispatchEvent } from '../utils'

export default defineComponent({
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  methods: {
    openSettings() {
      const dialogElement = this.$refs.settingsDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    closeSettings() {
      const dialogElement = this.$refs.settingsDialog as HTMLDialogElement
      dialogElement.close()
    },
    openOverwriteWarner() {
      const dialogElement = this.$refs.overwriteWarnDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    closeOverwriteWarner() {
      const dialogElement = this.$refs.overwriteWarnDialog as HTMLDialogElement
      dialogElement.close()
    }
  },
  mounted() {
    window.addEventListener('settings:open', () => {
      if ((this.storage === null) || (this.storage.project !== null)) return
      this.openSettings()
    })

    window.addEventListener('shortcut:settings', () => {
      dispatchEvent('settings:open')
    })
  },
  render() {
    return (
      <dialog
        ref="settingsDialog"
        id="settings"
        class="w-[700px] h-[500px] p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-full px-2 py-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
          <p class="text-xl text-center">設定</p>
          <div class="px-2 flex flex-col gap-4 grow overflow-y-scroll scrollbar-dark">
            <div class="h-fit flex flex-col p-4 bg-accent-light rounded-xl gap-4">
              <p class="text-center">キーボードショートカット</p>
              {
                (this.storage === null) ?
                (
                  <></>
                ) :
                (
                  Object.keys(this.storage.settings.keyboardShortcuts).map((key) => {
                    if (this.storage === null) return <></>
                    const shortcut = this.storage.settings.keyboardShortcuts[key]
                    return (
                      <div
                        key={ `keyboard-shortcut-${key}` }
                        class="h-fit flex justify-between items-center"
                      >
                        <p class="text-sm">{ shortcut.desc }</p>
                        <div class="h-fit flex items-center gap-1">
                          <div class="w-fit h-fit px-3 py-2 bg-accent rounded-xl">
                            <p class="text-light text-sm">Ctrl or Cmd</p>
                          </div>
                          <p>+</p>
                          <button
                            class={`
                              w-fit h-fit px-3 py-2 rounded-xl
                              ${(shortcut.alt) ? 'bg-accent' : 'bg-main'}
                            `}
                            onClick={() => shortcut.alt = !shortcut.alt}
                          >
                            <p class={`text-sm ${(shortcut.alt) ? 'text-light' : 'text-dark'}`}>
                              Alt
                            </p>
                          </button>
                          <p>+</p>
                          <button
                            class={`
                              w-fit h-fit px-3 py-2 rounded-xl
                              ${(shortcut.shift) ? 'bg-accent' : 'bg-main'}
                            `}
                            onClick={() => shortcut.shift = !shortcut.shift}
                          >
                            <p class={`text-sm ${(shortcut.shift) ? 'text-light' : 'text-dark'}`}>
                              Shift
                            </p>
                          </button>
                          <p>+</p>
                          <input
                            class="w-20 h-fit py-2 bg-accent rounded-xl text-sm text-center text-light"
                            value={ shortcut.code }
                            onKeydown={(event) => {
                              event.preventDefault()
                              shortcut.code = event.code
                            }}
                            onInput={(event) => {
                              if (event.target === null) return
                              const target = event.target as HTMLInputElement
                              target.value = shortcut.code
                            }}
                          ></input>
                        </div>
                      </div>
                    )
                  })
                )
              }
            </div>
            <div class="h-fit flex p-4 bg-accent-light rounded-xl justify-between items-center">
              <p>保存データ</p>
              <div class="w-fit h-fit flex gap-4">
                <button
                  class="w-32 h-fit py-2 bg-accent rounded-lg"
                  onClick={() => this.storage?.export()}
                >
                  <p class="text-light">エクスポート</p>
                </button>
                <button
                  class="w-32 h-fit py-2 bg-accent rounded-lg"
                  onClick={() => this.openOverwriteWarner()}
                >
                  <p class="text-light">インポート</p>
                </button>
                <input
                  ref="fileInput"
                  class="hidden"
                  type="file"
                  accept=".json"
                  onChange={(event) => {
                    if (event.target === null) return

                    const target = event.target as HTMLInputElement
                    const files = target.files

                    if ((files === null) || (files.length <= 0)) return

                    const file = files[0]
                    target.value = ''
                    this.storage?.import(file)
                  }}
                ></input>
              </div>
            </div>
          </div>
          <div class="flex justify-center items-center gap-4">
            <button
              class="w-32 py-2 bg-accent-light rounded-lg"
              onClick={() => this.closeSettings()}
              autofocus
            >
              <p>閉じる</p>
            </button>
          </div>
        </div>
        <dialog
          ref="overwriteWarnDialog"
          class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
          // @ts-ignore
          onCancel={(event: Event) => event.preventDefault()}
        >
          <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
            <p class="text-lg text-center text-red-300">!!! 警告 !!!</p>
            <div class="flex flex-col gap-2">
              <p class="text-center">インポートされたデータで既存の保存データを上書きします</p>
              <p class="text-center">エクスポートされていない保存データは消失します</p>
              <p class="text-center">この操作は取り消しできません</p>
              <p class="text-center">本当によろしいですか?</p>
            </div>
            <div class="flex justify-center items-center gap-4">
              <button
                class="w-32 py-2 bg-accent rounded-lg"
                onClick={() => {
                  (this.$refs.fileInput as HTMLInputElement).click()
                  this.closeOverwriteWarner()
                }}
              >
                <p class="text-light">OK</p>
              </button>
              <button
                class="w-32 py-2 bg-accent-light rounded-lg"
                onClick={() => this.closeOverwriteWarner()}
                autofocus
              >
                <p>キャンセル</p>
              </button>
            </div>
          </div>
        </dialog>
      </dialog>
    )
  }
})
