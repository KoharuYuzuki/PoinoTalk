import { defineComponent } from 'vue'

const component = defineComponent({
  methods: {
    open() {
      const dialogElement = this.$refs.engineInitDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    close() {
      const dialogElement = this.$refs.engineInitDialog as HTMLDialogElement
      dialogElement.close()
    }
  },
  render() {
    return (
      <dialog
        ref="engineInitDialog"
        id="engine-init-dialog"
        class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu outline-none"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-4">
          <p class="text-lg text-center">合成エンジン初期化中</p>
          <div class="flex flex-col gap-2">
            <p class="text-center">合成エンジンを初期化中です</p>
            <p class="text-center">しばらくお待ち下さい</p>
            <p class="text-center text-sm">(データのキャッシュがない場合は時間がかかります)</p>
          </div>
          <div class="h-fit flex justify-center">
            <div class="w-10 h-10 relative bg-accent-light rounded-[50%] flex justify-center items-center">
              <div class="w-6 h-6 bg-main rounded-[50%]"></div>
              <div class="w-10 h-10 absolute m-auto inset-0 flex justify-center rotate-loop">
                <div class="w-2 h-2 bg-accent rounded-[50%]"></div>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    )
  }
})

export default component
export type EngineInitDialogInstance = InstanceType<typeof component>
