import { defineComponent, toRaw } from 'vue'
import type { PropType } from 'vue'
import type { TextData } from './storage'
import { decorationAccent, decorationLengths, sum } from '../utils'

export default defineComponent({
  data(): {
    mode: 'accent' | 'length'
    textDataClone: TextData | null
  } {
    return {
      mode: 'accent',
      textDataClone: null
    }
  },
  props: {
    textData: {
      type: [Object, null] as PropType<TextData | null>,
      required: true
    }
  },
  watch: {
    textData: {
      handler() {
        this.textDataClone = structuredClone(
          toRaw(this.textData)
        )
      },
      deep: true
    }
  },
  emits: {
    change(textData: TextData) {
      return true
    }
  },
  render() {
    return (
      <div
        id="adjuster"
        class="h-[240px] p-2 bg-accent rounded-[1.25rem] flex gap-2 shrink-0"
      >
        <div class="w-fit h-full flex flex-col gap-2 shrink-0">
          <button
            class={`
              w-11 h-11 rounded-[0.75rem] transition-colors
              ${(this.mode === 'accent') ? 'bg-accent-light' : 'bg-main'}
            `}
            title="アクセント"
            onClick={() => this.mode = 'accent'}
          >
            <p class="text-dark">Acc</p>
          </button>
          <button
            class={`
              w-11 h-11 rounded-[0.75rem] transition-colors
              ${(this.mode === 'length') ? 'bg-accent-light' : 'bg-main'}
            `}
            title="長さ"
            onClick={() => this.mode = 'length'}
          >
            <p class="text-dark">Len</p>
          </button>
        </div>
        <div class="w-[calc(100%-3.25rem)] h-full px-6 pt-4 pb-2 bg-main rounded-[0.75rem]">
          <div class="w-full h-full pb-4 overflow-x-scroll scrollbar-dark">
            <div class="w-fit h-full min-w-full flex gap-4">
              {
                (this.textDataClone === null) ?
                (
                  <div class="h-full flex flex-col justify-center items-center gap-4 grow">
                    <p>テキストが選択されていません</p>
                  </div>
                ) :
                (this.textDataClone.kanaData.length <= 0) ?
                (
                  <div class="h-full flex flex-col justify-center items-center gap-4 grow">
                    <p>テキストの解析結果がありません</p>
                  </div>
                ) :
                (
                  this.textDataClone.kanaData.map((data, index) => (
                    <div
                      key={ `kana-data-${index}` }
                      class="w-12 h-full flex flex-col justify-between"
                    >
                      <p class="text-center">
                        { (this.mode === 'accent') ? decorationAccent(data.accent) : decorationLengths(data.lengths) }
                      </p>
                      <div class="w-full h-28 flex justify-center items-center">
                        <input
                          class={`w-28 rotate-[-90deg] ${(this.mode === 'accent') ? 'block' : 'hidden'}`}
                          type="range"
                          min="0"
                          max="1"
                          step="1"
                          value={ (data.accent === 'high') ? 1 : 0 }
                          onInput={(event) => {
                            if (event.target === null) return

                            const target = event.target as HTMLInputElement
                            const value = Number(target.value)

                            if (Number.isFinite(value) && (value >= 0.5)) {
                              data.accent = 'high'
                            } else {
                              data.accent = 'low'
                            }
                          }}
                          onChange={() => {
                            if (this.textDataClone === null) return
                            this.$emit('change', this.textDataClone)
                          }}
                        ></input>
                        <input
                          class={`w-28 rotate-[-90deg] ${(this.mode === 'length') ? 'block' : 'hidden'}`}
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={ sum(data.lengths) }
                          onInput={(event) => {
                            if (event.target === null) return

                            const target = event.target as HTMLInputElement
                            const value = Number(target.value)
                            if (!Number.isFinite(value)) return

                            data.lengths = data.lengthRatios.map((ratio) => value * ratio)
                          }}
                          onChange={() => {
                            if (this.textDataClone === null) return
                            this.$emit('change', this.textDataClone)
                          }}
                        ></input>
                      </div>
                      <p class="text-center">
                        { data.kana }
                      </p>
                    </div>
                  ))
                )
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
})
