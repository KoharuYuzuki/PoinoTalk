import { defineComponent, toRaw } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance, TextData } from './storage'
import { schemata } from 'poinotalk-engine'
import { dispatchEvent } from '../utils'

export default defineComponent({
  data(): {
    buttons: {
      [key: string]: {
        title: string
        maskImage: string
        handler: Function
      }
    }
    textWarnLen: number
  } {
    return {
      buttons: {
        add: {
          title: '追加',
          maskImage: '[mask-image:url(./assets/add.svg)]',
          handler: () => this.add()
        },
        play: {
          title: '再生',
          maskImage: '[mask-image:url(./assets/play.svg)]',
          handler: () => this.play()
        },
        save: {
          title: '書き出し',
          maskImage: '[mask-image:url(./assets/save.svg)]',
          handler: () => this.save()
        },
        remove: {
          title: '削除',
          maskImage: '[mask-image:url(./assets/remove.svg)]',
          handler: () => this.remove()
        }
      },
      textWarnLen: 60
    }
  },
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    },
    synthConfig: {
      type: Object as PropType<schemata.SynthConfig>,
      required: true
    },
    speakerId: {
      type: String as PropType<schemata.SpeakerIdEnum>,
      required: true
    },
    textDataId: {
      type: [String, null] as PropType<string | null>,
      required: true
    },
    speakerNames: {
      type: Object as PropType<{ [key in schemata.SpeakerIdEnum]: string }>,
      required: true
    },
    speakerImages: {
      type: Object as PropType<{ [key in schemata.SpeakerIdEnum]: string | null }>,
      required: true
    }
  },
  emits: {
    select(textDataId: string) {
      return true
    },
    unselect() {
      return true
    },
    changeSpeaker(payload: { textDataId: string, speakerId: schemata.SpeakerIdEnum }) {
      return true
    },
    remove(textDataId: string) {
      return true
    }
  },
  methods: {
    add() {
      if ((this.storage === null) || (this.storage.project === null)) return

      const selectedIndex = this.storage.project.textData.findIndex((data) => data.id === this.textDataId)
      const id = crypto.randomUUID()

      const textData: TextData = {
        id:          id,
        text:        '',
        kanaData:    [],
        speakerId:   this.speakerId,
        synthConfig: structuredClone(toRaw(this.synthConfig))
      }

      if ((this.textDataId === null) || (selectedIndex < 0)) {
        this.storage.project.textData.push(textData)
      } else {
        this.storage.project.textData.splice(selectedIndex + 1, 0, textData)
      }

      this.$emit('select', id)
    },
    play() {
      if (this.textDataId === null) return
      dispatchEvent('text:play', {
        textDataId: this.textDataId,
        prioritize: true
      })
    },
    save() {
      if (this.textDataId === null) return
      dispatchEvent('text:save', this.textDataId)
    },
    remove() {
      if (
        (this.textDataId === null) ||
        (this.storage === null) ||
        (this.storage.project === null)
      ) return

      const filtered = this.storage.project.textData.filter((data) => data.id !== this.textDataId)
      this.storage.project.textData = filtered.map((data) => toRaw(data))

      this.$emit('remove', this.textDataId)
      this.$emit('unselect')
    },
    up(textDataId: string) {
      if ((this.storage === null) || (this.storage.project === null)) return

      const target = this.storage.project.textData.find((data) => data.id === textDataId)
      const index = this.storage.project.textData.findIndex((data) => data.id === textDataId)
      if ((target === undefined) || (index <= 0)) return

      const newIndex = index - 1

      const newArray =
        this.storage.project.textData
        .filter((data) => data.id !== textDataId)
        .map((data) => toRaw(data))

      newArray.splice(newIndex, 0, toRaw(target))
      this.storage.project.textData = newArray
    },
    down(textDataId: string) {
      if ((this.storage === null) || (this.storage.project === null)) return

      const target = this.storage.project.textData.find((data) => data.id === textDataId)
      const index = this.storage.project.textData.findIndex((data) => data.id === textDataId)
      if ((target === undefined) || (index >= (this.storage.project.textData.length - 1))) return

      const newIndex = index + 1

      const newArray =
        this.storage.project.textData
        .filter((data) => data.id !== textDataId)
        .map((data) => toRaw(data))

      newArray.splice(newIndex, 0, toRaw(target))
      this.storage.project.textData = newArray
    },
    openSpeakerSelector() {
      const dialogElement = this.$refs.speakerSelector as HTMLDialogElement
      dialogElement.showModal()
    },
    closeSpeakerSelector() {
      const dialogElement = this.$refs.speakerSelector as HTMLDialogElement
      dialogElement.close()
    }
  },
  mounted() {
    window.addEventListener('shortcut:new', () => {
      if ((this.storage === null) || (this.storage.project === null)) return
      this.add()
    })

    window.addEventListener('shortcut:remove', () => {
      if ((this.storage === null) || (this.storage.project === null)) return
      this.remove()
    })
  },
  render() {
    return (
      <div
        id="texts"
        class="relative p-2 bg-accent rounded-[1.25rem] grow"
      >
        <div class="w-full h-full bg-main px-2 py-6 rounded-[0.75rem]">
          <div class="w-full h-full px-4 overflow-y-scroll scrollbar-dark">
            <div class="w-full h-fit min-h-full flex flex-col gap-6">
              {
                this.storage?.project?.textData.map((data) => (
                  <div
                    key={ `text-data-${data.id}` }
                    id={ `text-data-${data.id}` }
                    class="h-fit flex flex-col gap-2"
                    onClick={() => this.$emit('select', data.id)}
                  >
                    <div class="h-fit flex">
                      <button
                        class="w-14 h-14 my-1 rounded-[50%] shrink-0 overflow-hidden"
                        title={ this.speakerNames[data.speakerId] }
                        onClick={() => {
                          this.$emit('select', data.id)
                          this.openSpeakerSelector()
                        }}
                      >
                        {
                          (this.speakerImages[data.speakerId] === null) ?
                          (
                            <div class="w-full h-full bg-accent flex flex-col justify-center items-center">
                              <p class="text-light text-sm leading-3">No</p>
                              <p class="text-light text-sm leading-3 mb-1">Image</p>
                            </div>
                          ) :
                          (
                            <img
                              src={ this.speakerImages[data.speakerId] as string }
                            ></img>
                          )
                        }
                      </button>
                      <div class="h-fit relative ml-7 flex grow textarea-wrapper">
                        <textarea
                          class={`
                            w-full min-h-16 relative p-2 rounded-xl outline-none resize-y transition-colors
                            ${(this.textDataId === data.id) ? 'bg-accent text-light placeholder-light' : 'bg-accent-light text-dark'}
                          `}
                          placeholder="ここにテキストを入力"
                          value={ data.text }
                          onInput={(event) => {
                            if (event.target === null) return

                            const target = event.target as HTMLTextAreaElement
                            const inputType = (event as InputEvent).inputType
                            const value = target.value

                            if ((inputType === 'historyUndo') || (inputType === 'historyRedo')) {
                              target.value = data.text
                              return
                            }

                            this.storage?.skipAddingNextHistory()
                            data.text = value
                            dispatchEvent('text:update', {
                              textDataId: data.id,
                              analyzeText: true
                            })
                          }}
                          onFocus={() => this.$emit('select', data.id)}
                        ></textarea>
                        <div class={`
                          w-6 h-6 absolute m-auto top-8 left-[-1.5rem]
                          [mask-image:url(./assets/tail.svg)] transition-colors
                          ${(this.textDataId === data.id) ? 'bg-accent' : 'bg-accent-light'}
                        `}></div>
                      </div>
                      <div class="w-fit h-16 ml-2 flex flex-col justify-center gap-1 shrink-0">
                        <button
                          class="w-5 h-5"
                          title="上へ移動"
                          onClick={() => {
                            this.$emit('select', data.id)
                            this.up(data.id)
                          }}
                        >
                          <div class={`
                            w-full h-full [mask-image:url(./assets/triangle.svg)] transition-colors
                            ${(this.textDataId === data.id) ? 'bg-accent' : 'bg-accent-light'}
                          `}></div>
                        </button>
                        <button
                          class="w-5 h-5"
                          title="下へ移動"
                          onClick={() => {
                            this.$emit('select', data.id)
                            this.down(data.id)
                          }}
                        >
                          <div class={`
                            w-full h-full [mask-image:url(./assets/triangle.svg)] rotate-180 transition-colors
                            ${(this.textDataId === data.id) ? 'bg-accent' : 'bg-accent-light'}
                          `}></div>
                        </button>
                      </div>
                    </div>
                    {
                      ([...data.text].length > this.textWarnLen) ?
                      (
                        <div class="h-fit">
                          <p class="text-center text-sm text-red-300">
                            テキストが長いため正常に動作しない可能性があります
                          </p>
                        </div>
                      ) :
                      (
                        <></>
                      )
                    }
                  </div>
                ))
              }
              {
                (
                  (this.storage !== null) &&
                  (this.storage.project !== null) &&
                  (this.storage.project.textData.length <= 0)
                ) ?
                (
                  <div class="flex flex-col justify-center items-center gap-4 grow">
                    <p>まだテキストがありません</p>
                    <p>プラスマークのボタンから追加できます</p>
                  </div>
                ) :
                (
                  <div class="h-12"></div>
                )
              }
            </div>
          </div>
        </div>
        <div class="w-fit h-fit absolute m-auto right-8 bottom-8 flex items-center gap-3">
          {
            Object.keys(this.buttons).map((key) => (
              <button
                key={ `texts-button-${key}` }
                class="w-12 h-12 bg-accent rounded-[50%] flex justify-center items-center"
                title={ this.buttons[key].title }
                onClick={() => this.buttons[key].handler()}
              >
                <div class={`w-9 h-9 bg-main ${this.buttons[key].maskImage}`}></div>
              </button>
            ))
          }
        </div>
        <dialog
          ref="speakerSelector"
          class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
          // @ts-ignore
          onCancel={(event: Event) => event.preventDefault()}
        >
          <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
            <p class="text-lg text-center">キャラクター選択</p>
            <div class="flex flex-col gap-4">
              {
                schemata.speakerIds.map((speakerId) => (
                  <div
                    key={ `speaker-selector-${speakerId}` }
                    class="h-fit p-2 bg-accent-light rounded-xl flex items-center gap-4"
                  >
                    <div class="w-14 h-14 rounded-[50%] shrink-0 overflow-hidden">
                      {
                        (this.speakerImages[speakerId] === null) ?
                        (
                          <div class="w-full h-full bg-accent flex flex-col justify-center items-center">
                            <p class="text-light text-sm leading-3">No</p>
                            <p class="text-light text-sm leading-3 mb-1">Image</p>
                          </div>
                        ) :
                        (
                          <img
                            src={ this.speakerImages[speakerId] as string }
                          ></img>
                        )
                      }
                    </div>
                    <div class="w-[calc(100%-11rem)]">
                      <p class="truncate">{ this.speakerNames[speakerId] }</p>
                    </div>
                    <button
                      class="w-20 mr-2 py-2 bg-accent rounded-lg shrink-0"
                      onClick={() => {
                        if (
                          (this.textDataId === null) ||
                          (this.storage === null) ||
                          (this.storage.project === null)
                        ) {
                          this.closeSpeakerSelector()
                          return
                        }

                        this.$emit('changeSpeaker', {
                          textDataId: this.textDataId,
                          speakerId: speakerId
                        })

                        this.closeSpeakerSelector()
                      }}
                    >
                      <p class="text-light">選択</p>
                    </button>
                  </div>
                ))
              }
            </div>
            <div class="flex justify-center items-center gap-4">
              <button
                class="w-32 py-2 bg-accent-light rounded-lg"
                onClick={() => this.closeSpeakerSelector()}
                autofocus
              >
                <p>キャンセル</p>
              </button>
            </div>
          </div>
        </dialog>
      </div>
    )
  }
})
