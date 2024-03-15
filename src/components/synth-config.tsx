import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { presetsDefault } from './storage'
import type { StorageInstance } from './storage'
import { schemata } from 'poinotalk-engine'
import { dispatchEvent, decorationSynthConfigNumber } from '../utils'

export default defineComponent({
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    },
    synthConfig: {
      type: Object as PropType<schemata.SynthConfig>,
      required: true
    },
    presetId: {
      type: String as PropType<string>,
      required: true
    }
  },
  emits: {
    changePreset(presetId: string) {
      return true
    },
    changeConfig() {
      return true
    }
  },
  render() {
    return (
      <div
        id="synth-config"
        class="w-[280px] p-2 bg-accent rounded-[1.25rem] shrink-0 flex flex-col gap-2"
      >
        <div class="h-10 relative">
          <select
            class="w-full h-full px-8 bg-main rounded-[0.75rem] text-center truncate appearance-none"
            onChange={(event) => {
              if (event.target === null) return

              const target = event.target as HTMLSelectElement
              const value = target.value

              this.$emit('changePreset', value)
            }}
          >
            <option
              class="hidden"
              value={ presetsDefault.id }
              selected={ presetsDefault.id === this.presetId }
            >
              プリセットを選択
            </option>
            {
              this.storage?.settings.presets.map((preset) => (
                <option
                  key={ `preset-option-${preset.id}` }
                  value={ preset.id }
                  selected={ preset.id === this.presetId }
                >
                  { preset.name }
                </option>
              ))
            }
          </select>
          <div class="
            w-4 h-4 absolute m-auto top-[3px] right-[10px] bottom-0
            bg-dark [mask-image:url(./assets/down-arrow.svg)]
          "></div>
        </div>
        <div class="h-[calc(100%-6rem)] bg-main rounded-[0.75rem]">
          <div class="h-full p-2">
            <div class="h-full p-4 overflow-y-scroll scrollbar-dark">
              <div class="h-fit flex flex-col gap-6">
                <div class="flex flex-col gap-3">
                  <div class="flex justify-between items-center">
                    <p>話速</p>
                    <p>{ decorationSynthConfigNumber(this.synthConfig.speed) }</p>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ this.synthConfig.speed }
                    onInput={(event) => {
                      if (event.target === null) return

                      const target = event.target as HTMLInputElement
                      const value = Number(target.value)

                      if (Number.isFinite(value) && (this.synthConfig !== null)) {
                        this.synthConfig.speed = value
                      }
                    }}
                    onChange={() => this.$emit('changeConfig')}
                  ></input>
                </div>
                <div class="flex flex-col gap-3">
                  <div class="flex justify-between items-center">
                    <p>音量</p>
                    <p>{ decorationSynthConfigNumber(this.synthConfig.volume) }</p>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={ this.synthConfig.volume }
                    onInput={(event) => {
                      if (event.target === null) return

                      const target = event.target as HTMLInputElement
                      const value = Number(target.value)

                      if (Number.isFinite(value) && (this.synthConfig !== null)) {
                        this.synthConfig.volume = value
                      }
                    }}
                    onChange={() => this.$emit('changeConfig')}
                  ></input>
                </div>
                <div class="flex flex-col gap-3">
                  <div class="flex justify-between items-center">
                    <p>ピッチ</p>
                    <p>{ decorationSynthConfigNumber(this.synthConfig.pitch) }</p>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ this.synthConfig.pitch }
                    onInput={(event) => {
                      if (event.target === null) return

                      const target = event.target as HTMLInputElement
                      const value = Number(target.value)

                      if (Number.isFinite(value) && (this.synthConfig !== null)) {
                        this.synthConfig.pitch = value
                      }
                    }}
                    onChange={() => this.$emit('changeConfig')}
                  ></input>
                </div>
                <div class="flex justify-between items-center">
                  <p>ささやき</p>
                  <button
                    class={`
                      w-14 h-fit px-2 py-1 rounded-[1.75rem] transition-colors
                      ${(this.synthConfig.whisper === true) ? 'bg-accent' : 'bg-accent-light'}
                    `}
                    onClick={() => {
                      if (this.synthConfig === null) return
                      this.synthConfig.whisper = (this.synthConfig.whisper === true) ? false : true
                      this.$emit('changeConfig')
                    }}
                  >
                    <p class={`${(this.synthConfig.whisper === true) ? 'text-light' : 'text-dark'}`}>
                      { (this.synthConfig.whisper === true) ? 'ON' : 'OFF' }
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          class="h-10 bg-main rounded-[0.75rem]"
          onClick={() => dispatchEvent('preset:new')}
        >
          <p>プリセットを登録</p>
        </button>
      </div>
    )
  }
})
