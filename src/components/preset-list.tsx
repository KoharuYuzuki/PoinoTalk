import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance } from './storage'
import { decorationSynthConfigNumber } from '../utils'
import { dispatchEvent } from '../utils'

export default defineComponent({
  data(): {
    renamingPresetId: string | null
    removingPresetId: string | null
  } {
    return {
      renamingPresetId: null,
      removingPresetId: null
    }
  },
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  methods: {
    openPresetList() {
      const dialogElement = this.$refs.presetListDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    closePresetList() {
      const dialogElement = this.$refs.presetListDialog as HTMLDialogElement
      dialogElement.close()
    },
    openPresetNamer(presetId: string) {
      this.renamingPresetId = presetId
      const dialogElement = this.$refs.presetNamerDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    closePresetNamer() {
      this.renamingPresetId = null
      const dialogElement = this.$refs.presetNamerDialog as HTMLDialogElement
      dialogElement.close()
    },
    openPresetRemover(presetId: string) {
      this.removingPresetId = presetId
      const dialogElement = this.$refs.presetRemoverDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    closePresetRemover() {
      this.removingPresetId = null
      const dialogElement = this.$refs.presetRemoverDialog as HTMLDialogElement
      dialogElement.close()
    },
    changePresetName(presetId: string, newName: string) {
      this.storage?.settings.presets
      .filter((preset) => preset.id === presetId)
      .forEach((preset) => preset.name = newName)
    },
    getPresetName(presetId: string | null) {
      const unknown = '不明なプリセット'

      if ((presetId === null) || (this.storage === null)) {
        return unknown
      }

      const found = this.storage.settings.presets.find((preset) => preset.id === presetId)

      if (found === undefined) {
        return unknown
      } else {
        return found.name
      }
    },
    removePreset(presetId: string) {
      if (this.storage === null) return

      const filtered = this.storage.settings.presets.filter((preset) => preset.id !== presetId)
      this.storage.settings.presets = filtered
    }
  },
  mounted() {
    window.addEventListener('preset:list', () => {
      if ((this.storage === null) || (this.storage.project === null)) return
      this.openPresetList()
    })

    window.addEventListener('shortcut:preset', () => {
      dispatchEvent('preset:list')
    })
  },
  render() {
    return (
      <dialog
        ref="presetListDialog"
        id="preset-list"
        class="w-[700px] h-[500px] p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-full px-2 py-4 bg-main rounded-[0.75rem] flex flex-col gap-4">
          <p class="text-xl text-center">プリセット一覧</p>
          <div class="px-4 overflow-y-scroll grow scrollbar-dark">
            <div class="h-fit min-h-full flex flex-col gap-8">
              {
                (
                  (this.storage?.settings.presets.length === undefined) ||
                  (this.storage?.settings.presets.length <= 0)
                ) ? (
                  <div class="flex flex-col justify-center items-center gap-4 grow">
                    <p>まだプリセットがありません</p>
                    <p>"プリセットを登録" から登録できます</p>
                  </div>
                ) : (
                  <></>
                )
              }
              {
                this.storage?.settings.presets.map((preset) => (
                  <div
                    key={ `preset-${preset.id}` }
                    class="w-full h-fit flex gap-2"
                  >
                    <div class="w-[calc(100%-5.5rem)] px-4 py-2 bg-accent-light rounded-xl flex flex-col justify-center gap-2">
                      <p class="truncate">{ preset.name }</p>
                      <div class="flex items-center gap-4">
                        <p class="text-sm">話速 : { decorationSynthConfigNumber(preset.config.speed) }</p>
                        <p class="text-sm">音量 : { decorationSynthConfigNumber(preset.config.volume) }</p>
                        <p class="text-sm">ピッチ : { decorationSynthConfigNumber(preset.config.pitch) }</p>
                        <p class="text-sm">ささやき : { preset.config.whisper ? 'ON' : 'OFF' }</p>
                      </div>
                    </div>
                    <div class="flex flex-col gap-2 shrink-0">
                      <button
                        class="w-20 h-fit py-1 bg-accent rounded-lg"
                        onClick={() => {
                          const inputElement = this.$refs.presetNameInput as HTMLInputElement
                          inputElement.value = preset.name
                          this.openPresetNamer(preset.id)
                        }}
                      >
                        <p class="text-light">名称変更</p>
                      </button>
                      <button
                        class="w-20 h-fit py-1 bg-accent rounded-lg"
                        onClick={() => this.openPresetRemover(preset.id)}
                      >
                        <p class="text-light">削除</p>
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
          <div class="flex justify-center items-center gap-4">
            <button
              class="w-32 py-2 bg-accent-light rounded-lg"
              onClick={() => this.closePresetList()}
              autofocus
            >
              <p>閉じる</p>
            </button>
          </div>
        </div>
        <dialog
          ref="presetNamerDialog"
          class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
          // @ts-ignore
          onCancel={(event: Event) => event.preventDefault()}
        >
          <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
            <p class="text-lg text-center">プリセット名称変更</p>
            <div class="flex items-center gap-4">
              <p>名称</p>
              <input
                ref="presetNameInput"
                class="h-10 px-2 bg-accent-light rounded-lg grow"
                type="text"
                placeholder="名称未設定"
                autofocus
              ></input>
            </div>
            <div class="flex justify-center items-center gap-4">
              <button
                class="w-32 py-2 bg-accent rounded-lg"
                onClick={() => {
                  const inputElement = this.$refs.presetNameInput as HTMLInputElement
                  const presetName = (inputElement.value === '') ? '名称未設定' : inputElement.value
                  inputElement.value = ''

                  if (this.renamingPresetId !== null) {
                    this.changePresetName(this.renamingPresetId, presetName)
                  }
                  this.closePresetNamer()
                }}
              >
                <p class="text-light">変更</p>
              </button>
              <button
                class="w-32 py-2 bg-accent-light rounded-lg"
                onClick={() => {
                  const inputElement = this.$refs.presetNameInput as HTMLInputElement
                  inputElement.value = ''
                  this.closePresetNamer()
                }}
              >
                <p>キャンセル</p>
              </button>
            </div>
          </div>
        </dialog>
        <dialog
          ref="presetRemoverDialog"
          class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
          // @ts-ignore
          onCancel={(event: Event) => event.preventDefault()}
        >
          <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
            <p class="text-lg text-center">プリセット削除</p>
            <div class="flex flex-col gap-2">
              <div class="flex justify-center items-center">
                <p class="shrink-0">"</p>
                <p class="truncate">{ this.getPresetName(this.removingPresetId) }</p>
                <p class="shrink-0">" を削除します</p>
              </div>
              <p class="text-center">この操作は取り消しできません</p>
              <p class="text-center">本当によろしいですか?</p>
            </div>
            <div class="flex justify-center items-center gap-4">
              <button
                class="w-32 py-2 bg-accent rounded-lg"
                onClick={() => {
                  if (this.removingPresetId !== null) {
                    this.removePreset(this.removingPresetId)
                  }
                  this.closePresetRemover()
                }}
              >
                <p class="text-light">削除</p>
              </button>
              <button
                class="w-32 py-2 bg-accent-light rounded-lg"
                onClick={() => this.closePresetRemover()}
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
