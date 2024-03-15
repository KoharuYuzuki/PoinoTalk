import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance } from './storage'

const component = defineComponent({
  data(): {
    removingDictKey: string | null
  } {
    return {
      removingDictKey: null
    }
  },
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  methods: {
    open(dictKey: string) {
      if (this.storage === null) return
      if (!(dictKey in this.storage.settings.userDict)) return
      this.removingDictKey = dictKey

      const dialogElement = this.$refs.dictRemoverDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    close() {
      const dialogElement = this.$refs.dictRemoverDialog as HTMLDialogElement
      dialogElement.close()
    },
    removeDict(dictKey: string | null) {
      if ((dictKey === null) || (this.storage === null)) return

      if (dictKey in this.storage.settings.userDict) {
        delete this.storage.settings.userDict[dictKey]
      }
    }
  },
  render() {
    return (
      <dialog
        ref="dictRemoverDialog"
        id="dict-remover"
        class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
          <p class="text-lg text-center">辞書削除</p>
          <div class="flex flex-col gap-2">
            <div class="flex justify-center items-center">
              <p class="shrink-0">"</p>
              <p class="truncate">{ this.removingDictKey }</p>
              <p class="shrink-0">" を削除します</p>
            </div>
            <p class="text-center">この操作は取り消しできません</p>
            <p class="text-center">本当によろしいですか?</p>
          </div>
          <div class="flex justify-center items-center gap-4">
            <button
              class="w-32 py-2 bg-accent rounded-lg"
              onClick={() => {
                this.removeDict(this.removingDictKey)
                this.close()
              }}
            >
              <p class="text-light">削除</p>
            </button>
            <button
              class="w-32 py-2 bg-accent-light rounded-lg"
              onClick={() => this.close()}
              autofocus
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
export type DictRemoverInstance = InstanceType<typeof component>
