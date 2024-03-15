import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { AlertInstance } from './alert'
import type { StorageInstance } from './storage'
import { dispatchEvent } from '../utils'

export default defineComponent({
  data(): {
    projectIds: {
      menu: string | null
      renamer: string | null
      remover: string | null
    }
    display: {
      adder: boolean
    }
  } {
    return {
      projectIds: {
        menu: null,
        renamer: null,
        remover: null
      },
      display: {
        adder: false
      }
    }
  },
  props: {
    alert: {
      type: [Object, null] as PropType<AlertInstance | null>,
      required: true
    },
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  methods: {
    getProjectName(projectId: string | null) {
      const unknown = '不明なプロジェクト'

      if ((projectId === null) || (this.storage === null)) {
        return unknown
      }

      const found = this.storage.settings.projectInfo.find((info) => info.id === projectId)

      if (found === undefined) {
        return unknown
      } else {
        return found.name
      }
    },
    openProjectNamer() {
      const dialogElement = this.$refs.projectNamerDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    closeProjectNamer() {
      const dialogElement = this.$refs.projectNamerDialog as HTMLDialogElement
      dialogElement.close()
    },
    openProjectRemover() {
      const dialogElement = this.$refs.projectRemoverDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    closeProjectRemover() {
      const dialogElement = this.$refs.projectRemoverDialog as HTMLDialogElement
      dialogElement.close()
    }
  },
  watch: {
    'projectIds.renamer'() {
      if (this.projectIds.renamer === null) {
        this.closeProjectNamer()
      } else {
        this.openProjectNamer()
      }
    },
    'projectIds.remover'() {
      if (this.projectIds.remover === null) {
        this.closeProjectRemover()
      } else {
        this.openProjectRemover()
      }
    },
    'display.adder'() {
      if (this.display.adder) {
        this.openProjectNamer()
      } else {
        this.closeProjectNamer()
      }
    }
  },
  mounted() {
    window.addEventListener('project:new', () => {
      if ((this.storage === null) || (this.storage.project !== null)) return
      this.projectIds.menu = null
      this.display.adder = true
    })

    window.addEventListener('project:list', () => {
      if ((this.storage === null) || (this.storage.project === null)) return
      this.storage?.unloadProject()
    })

    window.addEventListener('shortcut:new', () => {
      dispatchEvent('project:new')
    })

    window.addEventListener('shortcut:projects', () => {
      dispatchEvent('project:list')
    })
  },
  render() {
    return (
      <div
        id="projects"
        class={`
          h-[calc(100%-3.5rem)] p-2 bg-accent rounded-[1.25rem]
          ${((this.storage?.project === undefined) || (this.storage?.project === null)) ? 'block' : 'hidden'}
        `}
      >
        <div class="h-full px-2 py-8 bg-main rounded-[0.75rem]">
          <div class="h-full overflow-y-scroll scrollbar-dark">
            <div class="h-fit min-h-full flex flex-col grow gap-8">
              <p class="text-xl mx-8">プロジェクト一覧</p>
              {
                (
                  (this.storage?.settings.projectInfo.length === undefined) ||
                  (this.storage?.settings.projectInfo.length <= 0)
                ) ? (
                  <div class="flex flex-col justify-center items-center grow gap-4">
                    <p>まだプロジェクトがありません</p>
                    <p>メニューの "新規プロジェクト" から作成できます</p>
                  </div>
                ) : (
                  <></>
                )
              }
              {
                this.storage?.settings.projectInfo
                .sort((a, b) => b.date - a.date)
                .map((info) => (
                  <div
                    key={ `project-${info.id}` }
                    class="h-24 relative bg-accent-light mx-6 rounded-xl flex flex-col justify-center gap-2"
                  >
                    <div class="mx-4 flex justify-between items-center">
                      <div class="w-4/5 h-fit">
                        <p class="text-xl w-full truncate">{ info.name }</p>
                      </div>
                      <button
                        class="w-20 h-fit py-1 bg-accent rounded-lg"
                        onClick={() => {
                          this.projectIds.menu = null

                          this.storage?.loadProject(info.id)
                          .catch((e) => {
                            console.error(e)

                            this.alert?.display([
                              'プロジェクトの読み込みに失敗しました',
                              '繰り返し表示される場合はページを再読み込みしてください',
                              String(e)
                            ])
                          })
                        }}
                      >
                        <p class="text-light">開く</p>
                      </button>
                    </div>
                    <div class="mx-4 flex justify-between items-center">
                      <div class="w-4/5 h-fit">
                        <p class="w-full truncate tracking-wider">{ new Date(info.date).toLocaleString() }</p>
                      </div>
                      <button
                        class="w-20 h-6 flex justify-center items-center gap-[4px]"
                        onClick={() => {
                          if (this.projectIds.menu === info.id) {
                            this.projectIds.menu = null
                          } else {
                            this.projectIds.menu = info.id
                          }
                        }}
                      >
                        <div class="w-1 h-1 bg-accent rounded-[2px]"></div>
                        <div class="w-1 h-1 bg-accent rounded-[2px]"></div>
                        <div class="w-1 h-1 bg-accent rounded-[2px]"></div>
                      </button>
                    </div>
                    <div class="
                      w-6 h-6 absolute m-auto left-[-1.5rem] bottom-2
                      bg-accent-light [mask-image:url(./assets/tail.svg)]
                    "></div>
                    <div class={`
                      w-fit h-fit absolute m-auto top-[5rem] right-0 p-4 rounded-xl
                      bg-main flex-col gap-4 z-10 drop-shadow-xl transform-gpu
                      ${(this.projectIds.menu === info.id) ? 'flex' : 'hidden'}
                    `}>
                      <button
                        class="w-20 h-fit py-1 bg-accent rounded-lg"
                        onClick={() => {
                          const inputElement = this.$refs.projectNameInput as HTMLInputElement
                          inputElement.value = info.name
                          this.projectIds.renamer = info.id
                          this.projectIds.menu = null
                        }}
                      >
                        <p class="text-light">名称変更</p>
                      </button>
                      <button
                        class="w-20 h-fit py-1 bg-accent rounded-lg"
                        onClick={() => {
                          this.projectIds.remover = info.id
                          this.projectIds.menu = null
                        }}
                      >
                        <p class="text-light">削除</p>
                      </button>
                    </div>
                  </div>
                ))
              }
              {
                (
                  (this.storage?.settings.projectInfo.length !== undefined) &&
                  (this.storage?.settings.projectInfo.length > 0)
                ) ? (
                  <div class="h-24"></div>
                ) : (
                  <></>
                )
              }
            </div>
          </div>
        </div>
        <dialog
          ref="projectNamerDialog"
          class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
          // @ts-ignore
          onCancel={(event: Event) => event.preventDefault()}
        >
          <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
            <p class="text-lg text-center">
              { this.display.adder ? '新規プロジェクト' : 'プロジェクト名称変更' }
            </p>
            <div class="flex items-center gap-4">
              <p>名称</p>
              <input
                ref="projectNameInput"
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
                  const inputElement = this.$refs.projectNameInput as HTMLInputElement
                  const projectName = (inputElement.value === '') ? '名称未設定' : inputElement.value
                  inputElement.value = ''

                  if (this.display.adder) {
                    this.storage?.addProject(projectName)
                    this.display.adder = false
                  } else {
                    if (this.projectIds.renamer !== null) {
                      this.storage?.renameProject(this.projectIds.renamer, projectName)
                    }
                    this.projectIds.renamer = null
                  }
                }}
              >
                <p class="text-light">
                  { this.display.adder ? '作成' : '変更' }
                </p>
              </button>
              <button
                class="w-32 py-2 bg-accent-light rounded-lg"
                onClick={() => {
                  const inputElement = this.$refs.projectNameInput as HTMLInputElement
                  inputElement.value = ''

                  if (this.display.adder) {
                    this.display.adder = false
                  } else {
                    this.projectIds.renamer = null
                  }
                }}
              >
                <p>キャンセル</p>
              </button>
            </div>
          </div>
        </dialog>
        <dialog
          ref="projectRemoverDialog"
          class="w-[500px] h-fit p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
          // @ts-ignore
          onCancel={(event: Event) => event.preventDefault()}
        >
          <div class="h-fit p-4 bg-main rounded-[0.75rem] flex flex-col gap-8">
            <p class="text-lg text-center">プロジェクト削除</p>
            <div class="flex flex-col gap-2">
              <div class="flex justify-center items-center">
                <p class="shrink-0">"</p>
                <p class="truncate">{ this.getProjectName(this.projectIds.remover) }</p>
                <p class="shrink-0">" を削除します</p>
              </div>
              <p class="text-center">この操作は取り消しできません</p>
              <p class="text-center">本当によろしいですか?</p>
            </div>
            <div class="flex justify-center items-center gap-4">
              <button
                class="w-32 py-2 bg-accent rounded-lg"
                onClick={() => {
                  if (this.projectIds.remover !== null) {
                    this.storage?.removeProject(this.projectIds.remover)
                    .catch((e) => {
                      console.error(e)

                      this.alert?.display([
                        'プロジェクトの削除に失敗しました',
                        '繰り返し表示される場合はページを再読み込みしてください',
                        String(e)
                      ])
                    })
                  }

                  this.projectIds.remover = null
                }}
              >
                <p class="text-light">削除</p>
              </button>
              <button
                class="w-32 py-2 bg-accent-light rounded-lg"
                onClick={() => {
                  this.projectIds.remover = null
                }}
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
