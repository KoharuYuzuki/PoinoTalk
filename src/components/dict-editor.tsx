import { defineComponent, toRaw } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance } from './storage'
import { schemata } from 'poinotalk-engine'
import { decorationAccent } from '../utils'

const kanaJoined =
  schemata.kanas
  .map((value) => value)
  .sort((a, b) => b.length - a.length)
  .join('|')

const kanaTestPattern = new RegExp(`^(${kanaJoined})+$`)
const kanaMatchPattern = new RegExp(`(${kanaJoined})`, 'g')

const component = defineComponent({
  data(): {
    mode: 'add' | 'edit'
    dictKeyOrig: string | null
    dictKey: string | null
    dictValue: schemata.OptiDict[number] | null
  } {
    return {
      mode: 'add',
      dictKeyOrig: null,
      dictKey: null,
      dictValue: null
    }
  },
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  methods: {
    open(dictKey: string | null = null) {
      if (this.storage === null) return

      this.mode = (dictKey === null) ? 'add' : 'edit'
      this.dictKeyOrig = dictKey
      this.dictKey = dictKey

      if ((dictKey !== null) && (dictKey in this.storage.settings.userDict)) {
        this.dictValue = structuredClone(toRaw(this.storage.settings.userDict[dictKey]))
      } else {
        this.dictValue = null
      }

      const wordInputElement = this.$refs.dictWordInput as HTMLInputElement
      if (this.dictKey === null) {
        wordInputElement.value = ''
      } else {
        wordInputElement.value = this.dictKey
      }

      const readingInputElement = this.$refs.dictReadingInput as HTMLInputElement
      if (this.dictValue === null) {
        readingInputElement.value = ''
      } else {
        readingInputElement.value = this.dictValue.map(({kana}) => kana).join('')
      }

      const dialogElement = this.$refs.dictEditorDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    close() {
      const dialogElement = this.$refs.dictEditorDialog as HTMLDialogElement
      dialogElement.close()
    },
    checkDuplicateDictKey(key: string | null) {
      if ((key === null) || (this.storage === null)) return false
      return (
        Object.keys(this.storage.settings.userDict)
        .filter((key) => key !== this.dictKeyOrig)
        .includes(key)
      )
    },
    isDisabled() {
      return (
        ((this.dictKey === null) || (this.dictKey === '')) ||
        ((this.dictValue === null) || (this.dictValue.length <= 0)) ||
        this.checkDuplicateDictKey(this.dictKey)
      )
    },
    updateDict() {
      if (this.isDisabled()) return
      if (this.storage === null) return

      const dict = this.storage.settings.userDict
      dict[this.dictKey as string] = structuredClone(toRaw(this.dictValue as schemata.OptiDict[number]))

      if ((this.dictKeyOrig !== null) && (this.dictKeyOrig !== this.dictKey)) {
        delete dict[this.dictKeyOrig]
      }
    }
  },
  render() {
    return (
      <dialog
        ref="dictEditorDialog"
        id="dict-editor"
        class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
          <p class="text-lg text-center">
            { (this.mode === 'add') ? '辞書追加' : '辞書編集' }
          </p>
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <p>単語</p>
              <input
                ref="dictWordInput"
                class="h-10 px-2 bg-accent-light rounded-lg grow"
                type="text"
                onInput={(event) => {
                  if (event.target === null) return

                  const target = event.target as HTMLInputElement
                  const value = target.value

                  this.dictKey = value
                }}
                autofocus
              ></input>
            </div>
            <p class={`
              text-sm text-center text-red-300
              ${(this.dictKey === '') ? 'block' : 'hidden'}
            `}>
              "単語" に空文字は使用できません
            </p>
            <p class={`
              text-sm text-center text-red-300
              ${this.checkDuplicateDictKey(this.dictKey) ? 'block' : 'hidden'}
            `}>
              "単語" が重複しています
            </p>
            <div class="flex items-center gap-4">
              <p>読み</p>
              <input
                ref="dictReadingInput"
                class="h-10 px-2 bg-accent-light rounded-lg grow"
                type="text"
                onInput={(event) => {
                  if (event.target === null) return

                  const target = event.target as HTMLInputElement
                  const value = target.value

                  if (!kanaTestPattern.test(value)) {
                    this.dictValue = []
                    return
                  }

                  const matched = value.match(kanaMatchPattern)
                  if (matched === null) return

                  this.dictValue = matched.map((value) => {
                    return {
                      kana: value as schemata.KanaEnum,
                      accent: 'low'
                    }
                  })
                }}
              ></input>
            </div>
            <p class={`
              text-sm text-center text-red-300
              ${((this.dictValue !== null) && (this.dictValue.length <= 0)) ? 'block' : 'hidden'}
            `}>
              "読み" が無効です
            </p>
            <div class="flex flex-col gap-4">
              <p>アクセント</p>
              <div class="h-fit p-2 bg-accent-light rounded-lg">
                <div class="h-44 mx-2 py-4 flex gap-2 overflow-x-scroll scrollbar-dark">
                  {
                    this.dictValue?.map((item, index) => (
                      <div
                        key={ `dict-value-item-${index}` }
                        class="w-12 h-full flex flex-col gap-2"
                      >
                        <p class="text-sm text-center">
                          { decorationAccent(item.accent) }
                        </p>
                        <div class="flex justify-center items-center grow">
                          <input
                            class="w-20 rotate-[-90deg]"
                            type="range"
                            min="0"
                            max="1"
                            value={ (item.accent === 'low') ? '0' : '1' }
                            onInput={(event) => {
                              if (event.target === null) return

                              const target = event.target as HTMLInputElement
                              const value = Number(target.value)

                              if (Number.isFinite(value) && (value >= 0.5)) {
                                item.accent = 'high'
                              } else {
                                item.accent = 'low'
                              }
                            }}
                          ></input>
                        </div>
                        <p class="text-sm text-center">{ item.kana }</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-center items-center gap-4">
            <button
              class="w-32 py-2 bg-accent rounded-lg"
              onClick={() => {
                this.updateDict()
                this.close()
              }}
              disabled={ this.isDisabled() }
            >
              <p class="text-light">
                { (this.mode === 'add') ? '追加' : '保存' }
              </p>
            </button>
            <button
              class="w-32 py-2 bg-accent-light rounded-lg"
              onClick={() => this.close()}
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
export type DictEditorInstance = InstanceType<typeof component>
