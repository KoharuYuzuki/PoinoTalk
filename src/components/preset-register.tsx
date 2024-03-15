import { defineComponent } from 'vue'

const component = defineComponent({
  methods: {
    open() {
      const dialogElement = this.$refs.presetRegisterDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    close() {
      const dialogElement = this.$refs.presetRegisterDialog as HTMLDialogElement
      dialogElement.close()
    }
  },
  emits: {
    register(presetName: string) {
      return true
    },
    cancel() {
      return true
    }
  },
  render() {
    return (
      <dialog
        ref="presetRegisterDialog"
        id="preset-register"
        class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
          <p class="text-lg text-center">プリセット登録</p>
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
                this.$emit('register', presetName)
              }}
            >
              <p class="text-light">登録</p>
            </button>
            <button
              class="w-32 py-2 bg-accent-light rounded-lg"
              onClick={() => {
                const inputElement = this.$refs.presetNameInput as HTMLInputElement
                inputElement.value = ''
                this.$emit('cancel')
              }}
            >
              <p>キャンセル</p>
            </button>
          </div>
        </div>
      </dialog>
    )
  }
})

export default component
export type PresetRegisterInstance = InstanceType<typeof component>
