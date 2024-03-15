import { defineComponent } from 'vue'
import type { VNode } from 'vue'
import Link from './link'
import config from '../config'
import { dispatchEvent } from '../utils'

export default defineComponent({
  data(): {
    helpList: {
      [key: string]: {
        label: string
        contents: VNode
      }
    },
    selectedKey: string
  } {
    return {
      helpList: {
        license: {
          label: 'ライセンス',
          contents: (
            <>
              <div class="flex flex-col gap-1">
                <p>{ config.appName } { config.version } を利用するにはライセンス (利用規約) に同意する必要があります。</p>
                <p>以下のライセンスは { config.appName } { config.version } 及び { config.appName } { config.version } で合成された音声に適用されます。</p>
                <p>
                  また、不明な点については
                  <Link
                    newTab={ true }
                    href={ config.licenseQAUrl }
                  >
                    {() => 'ライセンスQ&A'}
                  </Link>
                  やヘルプのQ&Aをご参照ください。
                </p>
              </div>
              <div class="flex flex-col gap-1">
                {
                  config.license.split('\n').map((line, index) => (
                    <p
                      key={ `license-line-${index}` }
                      class="text-sm"
                    >
                      { line }
                    </p>
                  ))
                }
              </div>
            </>
          )
        },
        thirdPartyLicense: {
          label: 'サードパーティー\nライセンス',
          contents: (
            <>
              <div class="flex flex-col gap-1">
                {
                  config.thirdPartyNotices.split('\n').map((line, index) => (
                    <p
                      key={ `third-party-notices-line-${index}` }
                      class="text-sm"
                    >
                      { line }
                    </p>
                  ))
                }
              </div>
            </>
          )
        },
        qa: {
          label: 'Q&A',
          contents: (
            <>
              <div class="flex flex-col gap-2">
                {
                  config.qa.split('\n').map((line, index) => (
                    <p
                      key={ `qa-line-${index}` }
                      class={`
                        text-sm
                        ${this.isQuestionLine(line) ? 'text-light p-2 bg-accent rounded-lg' : ''}
                      `}
                    >
                      {
                        this.isURLLine(line) ?
                        (
                          <Link
                            newTab={ true }
                            href={ line }
                          >
                            {() => line}
                          </Link>
                        ) :
                        line
                      }
                    </p>
                  ))
                }
              </div>
            </>
          )
        },
        privacyPolicy: {
          label: 'プライバシー\nポリシー',
          contents: (
            <>
              <div class="flex flex-col gap-1">
                <p>当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。</p>
                <p>このGoogleアナリティクスはデータの収集のためにCookieを使用しています。</p>
                <p>このデータは匿名で収集されており、個人を特定するものではありません。</p>
                <p>この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。</p>
                <p>
                  この規約に関しての詳細は
                  <Link
                    newTab={ true }
                    href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                  >
                    {() => 'Googleアナリティクスサービス利用規約'}
                  </Link>
                  のページや
                  <Link
                    newTab={ true }
                    href="https://policies.google.com/technologies/ads?hl=ja"
                  >
                    {() => 'Googleポリシーと規約ページ'}
                  </Link>
                  をご覧ください。
                </p>
              </div>
            </>
          )
        }
      },
      selectedKey: 'license'
    }
  },
  methods: {
    open() {
      const dialogElement = this.$refs.helpDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    close() {
      const dialogElement = this.$refs.helpDialog as HTMLDialogElement
      dialogElement.close()
    },
    isQuestionLine(line: string) {
      return line.slice(0, 2) === 'Q.'
    },
    isURLLine(line: string) {
      return line.slice(0, 4) === 'http'
    }
  },
  mounted() {
    window.addEventListener('help:open', () => {
      this.open()
    })

    window.addEventListener('shortcut:help', () => {
      dispatchEvent('help:open')
    })
  },
  render() {
    return (
      <dialog
        ref="helpDialog"
        id="help"
        class="w-[700px] h-[500px] p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-full px-2 py-4 bg-main rounded-[0.75rem] flex flex-col gap-4">
          <p class="text-xl text-center">ヘルプ</p>
          <div class="h-[calc(100%-6.25rem)] px-2 flex gap-4">
            <div class="w-40 h-full shrink-0">
              <div class="h-fit flex flex-col gap-4">
                {
                  Object.keys(this.helpList).map((key) => (
                    <button
                      key={ `help-button-${key}` }
                      class={`
                        h-12 rounded-lg
                        ${(this.selectedKey === key) ? 'bg-accent' : 'bg-accent-light'}
                      `}
                      onClick={() => this.selectedKey = key}
                    >
                      {
                        this.helpList[key].label.split('\n').map((str, index, array) => {
                          if (array.length > 1) {
                            return (
                              <p
                                key={ `help-button-${key}-label-line-${index}` }
                                class={`text-sm ${(this.selectedKey === key) ? 'text-light' : 'text-dark'}`}
                              >
                                { str }
                              </p>
                            )
                          } else {
                            return (
                              <p
                                key={ `help-button-${key}-label-line-${index}` }
                                class={`${(this.selectedKey === key) ? 'text-light' : 'text-dark'}`}
                              >
                                { str }
                              </p>
                            )
                          }
                        })
                      }
                    </button>
                  ))
                }
              </div>
            </div>
            <div class="w-[calc(100%-11rem)] h-full p-2 bg-accent-light rounded-lg">
              <div class="w-full h-full overflow-y-scroll scrollbar-dark">
                <div class="w-full h-fit min-h-full p-2 flex flex-col gap-8 break-all">
                  { this.helpList[this.selectedKey].contents }
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-center items-center gap-4">
            <button
              class="w-32 py-2 bg-accent-light rounded-lg"
              onClick={() => this.close()}
              autofocus
            >
              <p>閉じる</p>
            </button>
          </div>
        </div>
      </dialog>
    )
  }
})
