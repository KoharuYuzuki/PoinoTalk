import { defineComponent, toRaw } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance } from './storage'
import Link from './link'
import config from '../config'

export default defineComponent({
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  methods: {
    open() {
      const dialogElement = this.$refs.licenseConfirmerDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    close() {
      const dialogElement = this.$refs.licenseConfirmerDialog as HTMLDialogElement
      dialogElement.close()
    },
    agree() {
      if (this.storage === null) return

      const clone = structuredClone(toRaw(this.storage.settings))
      clone.licenseAgreed = true
      this.storage.settings = clone
    }
  },
  mounted() {
    window.addEventListener('settings:loaded', () => {
      if (
        (this.storage !== null) &&
        (this.storage.settings.licenseAgreed === false)
      ) {
        this.open()
      }
    }, { once: true })
  },
  render() {
    return (
      <dialog
        ref="licenseConfirmerDialog"
        id="license-confirmer"
        class="w-[700px] h-[500px] p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-full px-2 py-4 bg-main rounded-[0.75rem] flex flex-col gap-4">
          <p class="text-xl text-center">ライセンス</p>
          <div class="px-4 overflow-y-scroll grow scrollbar-dark">
            <div class="h-fit min-h-full flex flex-col gap-8">
              <div class="flex flex-col gap-1">
                <p class="text-center">{ config.appName } { config.version } にアクセスいただきありがとうございます。</p>
                <p class="text-center">{ config.appName } { config.version } を利用するにはライセンス (利用規約) に同意する必要があります。</p>
                <p class="text-center">以下のライセンスは { config.appName } { config.version } 及び { config.appName } { config.version } で合成された音声に適用されます。</p>
                <p class="text-center">
                  また、不明な点については
                  <Link
                    newTab={ true }
                    href={ config.licenseQAUrl }
                  >
                    {() => 'ライセンスQ&A'}
                  </Link>
                  や
                  <Link
                    newTab={ true }
                    href={ config.qaUrl }
                  >
                    {() => 'PoinoTalk Q&A'}
                  </Link>
                  をご参照ください。
                </p>
              </div>
              <div class="flex flex-col gap-1">
                {
                  config.license.split('\n').map((line, index) => (
                    <p
                      key={ `license-confirmer-line-${index}` }
                      class="text-sm"
                    >
                      { line }
                    </p>
                  ))
                }
              </div>
            </div>
          </div>
          <div class="flex justify-center items-center gap-4">
            <button
              class="w-32 py-2 bg-accent rounded-lg"
              onClick={() => {
                this.agree()
                this.close()
              }}
              autofocus
            >
              <p class="text-light">同意する</p>
            </button>
          </div>
        </div>
      </dialog>
    )
  }
})
