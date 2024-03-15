import { defineComponent, toRaw } from 'vue'
import type { PropType } from 'vue'
import type { AlertInstance } from './alert'
import { presetsDefault } from './storage'
import type { StorageInstance, ExtendedKanaData, TextData } from './storage'
import Texts from './texts'
import SynthConfig from './synth-config'
import Adjuster from './adjuster'
import PresetRegister from './preset-register'
import type { PresetRegisterInstance } from './preset-register'
import { schemata } from 'poinotalk-engine'
import { uuid, dispatchEvent, sum, downloadFile } from '../utils'
import type { Message, SynthData } from '../worker'

interface WorkerResult {
  id:   string | null
  type: 'success' | 'error'
  data: any
}

export default defineComponent({
  data(): {
    speakerNames: { [key in schemata.SpeakerIdEnum]: string }
    speakerImages: { [key in schemata.SpeakerIdEnum]: string | null }
    synthConfig: schemata.SynthConfig
    presetId: string
    speakerId: schemata.SpeakerIdEnum
    textDataId: string | null
    textData: TextData | null
    engineIsReady: boolean
    enginePromise: Promise<void>
    voiceCache: { [key: string]: string }
    player: HTMLAudioElement
    playerQueue: string[]
    playerPlaying: boolean
  } {
    return {
      speakerNames: {
        laychie: 'レイチー',
        layney: 'レイニー'
      },
      speakerImages: {
        laychie: './assets/laychie.png',
        layney: './assets/layney.png'
      },
      synthConfig: structuredClone(presetsDefault.config),
      presetId: presetsDefault.id,
      speakerId: schemata.speakerIds[0],
      textDataId: null,
      textData: null,
      engineIsReady: false,
      enginePromise: Promise.resolve(),
      voiceCache: {},
      player: new Audio(),
      playerQueue: [],
      playerPlaying: false
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
    },
    worker: {
      type: Worker as PropType<Worker>,
      required: true
    }
  },
  methods: {
    registerPreset(presetName: string) {
      if (this.storage === null) return

      const id = uuid()

      this.storage.settings.presets.push({
        id:     id,
        name:   presetName,
        config: structuredClone(toRaw(this.synthConfig))
      })

      this.presetId = id
    },
    setPreset(presetId: string) {
      if (this.storage === null) return

      const found = this.storage.settings.presets.find((preset) => preset.id === presetId)
      if (found === undefined) return

      this.synthConfig = structuredClone(toRaw(found.config))
      this.presetId = found.id

      if (this.textData === null) return

      if (
        (this.textData.synthConfig.speed   !== this.synthConfig.speed)   ||
        (this.textData.synthConfig.volume  !== this.synthConfig.volume)  ||
        (this.textData.synthConfig.pitch   !== this.synthConfig.pitch)   ||
        (this.textData.synthConfig.whisper !== this.synthConfig.whisper)
      ) {
        this.textData.synthConfig = structuredClone(toRaw(this.synthConfig))
      }
    },
    openPresetRegister() {
      const presetRegister = this.$refs.presetRegister as PresetRegisterInstance
      presetRegister.open()
    },
    closePresetRegister() {
      const presetRegister = this.$refs.presetRegister as PresetRegisterInstance
      presetRegister.close()
    },
    postMessage(message: Message) {
      this.worker.postMessage(message)
    },
    checkBackend() {
      return new Promise<boolean>((resolve, reject) => {
        const id = crypto.randomUUID()

        window.addEventListener(id, (event) => {
          const result = (event as CustomEvent).detail as WorkerResult

          if (result.type === 'success') {
            resolve(result.data)
          } else {
            this.alert?.display([
              '合成エンジンのバックエンドのチェックに失敗しました',
              'ページを再読み込みしてください',
              String(result.data)
            ])
            reject(result.data)
          }
        }, { once: true })

        this.postMessage({
          id:   id,
          type: 'engine:backend:check',
          data: null
        })
      })
    },
    initEngine() {
      return new Promise<void>((resolve, reject) => {
        const id = crypto.randomUUID()

        window.addEventListener(id, (event) => {
          const result = (event as CustomEvent).detail as WorkerResult

          if (result.type === 'success') {
            this.engineIsReady = true
            console.log('engine:ready')
            resolve()
          } else {
            this.alert?.display([
              '合成エンジンの初期化に失敗しました',
              'ページを再読み込みしてください',
              String(result.data)
            ])
            reject(result.data)
          }
        }, { once: true })

        this.postMessage({
          id:   id,
          type: 'engine:init',
          data: null
        })
      })
    },
    loadUserDictIntoEngine() {
      return new Promise<void>((resolve, reject) => {
        if (
          (this.storage === null) ||
          (Object.keys(this.storage.settings.userDict).length <= 0)
        ) {
          console.log('dict:empty')
          return
        }

        const id = crypto.randomUUID()

        window.addEventListener(id, (event) => {
          const result = (event as CustomEvent).detail as WorkerResult

          if (result.type === 'success') {
            console.log('dict:load')
            resolve()
          } else {
            this.alert?.display([
              '合成エンジンでユーザー辞書の読み込みに失敗しました',
              'ページを再読み込みしてください',
              String(result.data)
            ])
            reject(result.data)
          }
        }, { once: true })

        this.postMessage({
          id:   id,
          type: 'engine:dict:load',
          data: toRaw(this.storage.settings.userDict)
        })
      })
    },
    clearEngineUserDict() {
      return new Promise<void>((resolve, reject) => {
        const id = crypto.randomUUID()

        window.addEventListener(id, (event) => {
          const result = (event as CustomEvent).detail as WorkerResult

          if (result.type === 'success') {
            console.log('dict:clear')
            resolve()
          } else {
            this.alert?.display([
              '合成エンジンでユーザー辞書のクリアに失敗しました',
              'ページを再読み込みしてください',
              String(result.data)
            ])
            reject(result.data)
          }
        }, { once: true })

        this.postMessage({
          id:   id,
          type: 'engine:dict:clear',
          data: null
        })
      })
    },
    analyzeText(text: string) {
      return new Promise<schemata.KanaData[]>((resolve, reject) => {
        const id = crypto.randomUUID()

        window.addEventListener(id, (event) => {
          const result = (event as CustomEvent).detail as WorkerResult

          if (result.type === 'success') {
            console.log('text:analyze')
            resolve(result.data)
          } else {
            this.alert?.display([
              'テキストの解析に失敗しました',
              '繰り返し表示される場合はページを再読み込みしてください',
              String(result.data)
            ])
            reject(result.data)
          }
        }, { once: true })

        this.postMessage({
          id:   id,
          type: 'engine:analyze',
          data: text
        })
      })
    },
    synthVoice(data: SynthData) {
      return new Promise<string>((resolve, reject) => {
        const id = crypto.randomUUID()

        window.addEventListener(id, (event) => {
          const result = (event as CustomEvent).detail as WorkerResult

          if (result.type === 'success') {
            console.log('voice:synth')
            const wav = result.data as Float32Array
            const blob = new Blob([wav.buffer as ArrayBuffer], { type: 'audio/wav' })
            const url = URL.createObjectURL(blob)
            resolve(url)
          } else {
            this.alert?.display([
              '音声の合成に失敗しました',
              '繰り返し表示される場合はページを再読み込みしてください',
              String(result.data)
            ])
            reject(result.data)
          }
        }, { once: true })

        this.postMessage({
          id:   id,
          type: 'engine:synth',
          data: {
            analyzedData: data.analyzedData,
            speakerId:    data.speakerId,
            config:       data.config
          }
        })
      })
    },
    playVoice(url: string, prioritize: boolean = false) {
      if (!prioritize) {
        this.playerQueue.push(url)
        return
      }

      this.playerQueue = [url]
      if (!this.player.paused) {
        this.player.currentTime = this.player.duration
      }
    },
    playNextVoice() {
      this.playerPlaying = true

      const delayMs = 500
      const url = this.playerQueue.shift()

      if (url === undefined) {
        this.playerPlaying = false
        return
      }

      setTimeout(() => {
        this.player.src = url
        this.player.play()
        this.scrollIntoViewByObjectURL(url)
      }, delayMs)
    },
    removeVoiceCache(textDataId: string) {
      if (!(textDataId in this.voiceCache)) return
      URL.revokeObjectURL(this.voiceCache[textDataId])
      delete this.voiceCache[textDataId]
    },
    scrollIntoViewByObjectURL(url: string) {
      const found = Object.keys(this.voiceCache).find((key) => this.voiceCache[key] === url)
      if (found === undefined) return

      const element = document.querySelector(`#text-data-${found}`)
      if (element === null) return

      (element as HTMLDivElement).click()
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    },
    updateTextData() {
      if (
        (this.textDataId === null) ||
        (this.storage === null) ||
        (this.storage.project === null)
      ) {
        this.textData = null
        return
      }

      const found = this.storage.project.textData.find((data) => data.id === this.textDataId)
      if (found === undefined) {
        this.textData = null
        return
      }

      this.textData = found
    }
  },
  watch: {
    textDataId() {
      this.updateTextData()
    },
    'storage.project': {
      handler() {
        this.updateTextData()
      },
      deep: true
    },
    'storage.settings.userDict': {
      handler() {
        if (!this.engineIsReady) return

        this.clearEngineUserDict()
        .then(() => this.loadUserDictIntoEngine())
        .catch((_) => {})
      },
      deep: true
    },
    'textData.synthConfig': {
      handler() {
        if (this.textData === null) return

        if (
          (this.textData.synthConfig.speed   !== this.synthConfig.speed)   ||
          (this.textData.synthConfig.volume  !== this.synthConfig.volume)  ||
          (this.textData.synthConfig.pitch   !== this.synthConfig.pitch)   ||
          (this.textData.synthConfig.whisper !== this.synthConfig.whisper)
        ) {
          this.synthConfig = structuredClone(toRaw(this.textData.synthConfig))
        }
      },
      deep: true
    },
    playerQueue: {
      handler() {
        if (!this.playerPlaying && (this.playerQueue.length > 0)) {
          this.playNextVoice()
        }
      },
      deep: true
    }
  },
  mounted() {
    window.addEventListener('preset:new', () => {
      this.openPresetRegister()
    })

    window.addEventListener('project:list', () => {
      this.synthConfig = structuredClone(presetsDefault.config)
      this.presetId = presetsDefault.id
      this.speakerId = schemata.speakerIds[0]
      this.textDataId = null
      Object.keys(this.voiceCache).forEach((key) => this.removeVoiceCache(key))
    })

    window.addEventListener('text:update', (event) => {
      if (
        !this.engineIsReady ||
        (this.storage === null) ||
        (this.storage.project === null)
      ) return

      const textDataId  = (event as CustomEvent).detail.textDataId as string
      const analyzeText = ((event as CustomEvent).detail.analyzeText as boolean) === true

      const found = this.storage.project.textData.find((data) => data.id === textDataId)
      if (found === undefined) return

      this.removeVoiceCache(found.id)

      if (!analyzeText) return

      this.enginePromise = (
        this.enginePromise
        .then(() => this.analyzeText(found.text))
        .then((kanaData) => {
          found.kanaData = kanaData.map((item) => {
            const totalLength = sum(item.lengths)
            const data: ExtendedKanaData = {
              kana:         item.kana,
              accent:       item.accent,
              lengths:      item.lengths,
              lengthRatios: item.lengths.map((length) => length / totalLength)
            }
            return data
          })
        })
        .catch((_) => {})
      )
    })

    window.addEventListener('text:play', (event) => {
      if (
        !this.engineIsReady ||
        (this.storage === null) ||
        (this.storage.project === null)
      ) return

      const textDataId = (event as CustomEvent).detail.textDataId as string
      const prioritize = ((event as CustomEvent).detail.prioritize as boolean) === true

      const found = this.storage.project.textData.find((data) => data.id === textDataId)
      if (found === undefined) return

      if (found.id in this.voiceCache) {
        this.enginePromise = (
          this.enginePromise
          .then(() => this.playVoice(this.voiceCache[found.id], prioritize))
          .catch((_) => {})
        )
        return
      }

      const analyzedData: schemata.KanaData[] = found.kanaData.map((item) => {
        return {
          kana:    item.kana,
          accent:  item.accent,
          lengths: toRaw(item.lengths)
        }
      })

      const synthData: SynthData = {
        analyzedData: analyzedData,
        speakerId:    found.speakerId,
        config:       toRaw(found.synthConfig)
      }

      this.enginePromise = (
        this.enginePromise
        .then(() => this.synthVoice(synthData))
        .then((url) => {
          this.voiceCache[found.id] = url
          this.playVoice(url, prioritize)
        })
        .catch((_) => {})
      )
    })

    window.addEventListener('text:save', (event) => {
      if (
        !this.engineIsReady ||
        (this.storage === null) ||
        (this.storage.project === null)
      ) return

      const textDataId = (event as CustomEvent).detail as string
      const textData = this.storage.project.textData.find((data) => data.id === textDataId)
      const index = this.storage.project.textData.findIndex((data) => data.id === textDataId)
      if ((textData === undefined) || (index === -1)) return

      const minDigit = 3
      const digit = Math.max(minDigit, String(this.storage.project.textData.length).length)
      const number = ([...new Array(digit)].fill('0').join('') + String(index + 1)).slice(-digit)

      const speakerName = this.speakerNames[textData.speakerId]

      const minBeginningLen = 9
      const isOverLength = [...textData.text].length > minBeginningLen
      const beginning = [...textData.text].slice(0, minBeginningLen).join('') + (isOverLength ? '…' : '')

      const fileName = `${number}_${speakerName}_${beginning}.wav`

      if (textData.id in this.voiceCache) {
        this.enginePromise = (
          this.enginePromise
          .then(() => downloadFile(fileName, this.voiceCache[textData.id]))
          .catch((_) => {})
        )
        return
      }

      const analyzedData: schemata.KanaData[] = textData.kanaData.map((item) => {
        return {
          kana:    item.kana,
          accent:  item.accent,
          lengths: toRaw(item.lengths)
        }
      })

      const synthData: SynthData = {
        analyzedData: analyzedData,
        speakerId:    textData.speakerId,
        config:       toRaw(textData.synthConfig)
      }

      this.enginePromise = (
        this.enginePromise
        .then(() => this.synthVoice(synthData))
        .then((url) => {
          this.voiceCache[textData.id] = url
          downloadFile(fileName, url)
        })
        .catch((_) => {})
      )
    })

    window.addEventListener('text:save:all', () => {
      if (
        (this.storage === null) ||
        (this.storage.project === null)
      ) return

      this.storage.project.textData.forEach((data) => {
        dispatchEvent('text:save', data.id)
      })
    })

    window.addEventListener('text:play:all', () => {
      if (
        (this.storage === null) ||
        (this.storage.project === null)
      ) return

      this.storage.project.textData.forEach((data, index) => {
        dispatchEvent('text:play', {
          textDataId: data.id,
          prioritize: (index === 0)
        })
      })
    })

    window.addEventListener('editor:undo', () => {
      if ((this.storage === null) || (this.storage.project === null)) return
      this.storage.undo()
    })

    window.addEventListener('editor:redo', () => {
      if ((this.storage === null) || (this.storage.project === null)) return
      this.storage.redo()
    })

    window.addEventListener('shortcut:play', () => {
      if (this.textDataId === null) return
      dispatchEvent('text:play', {
        textDataId: this.textDataId,
        prioritize: true
      })
    })

    window.addEventListener('shortcut:save', () => {
      if (this.textDataId === null) return
      dispatchEvent('text:save', this.textDataId)
    })

    window.addEventListener('shortcut:play:all', () => {
      dispatchEvent('text:play:all')
    })

    window.addEventListener('shortcut:save:all', () => {
      dispatchEvent('text:save:all')
    })

    window.addEventListener('shortcut:undo', () => {
      dispatchEvent('editor:undo')
    })

    window.addEventListener('shortcut:redo', () => {
      dispatchEvent('editor:redo')

    })

    this.player.addEventListener('ended', () => {
      this.playNextVoice()
    })

    this.worker.addEventListener('message', (event) => {
      if (event.data.id === null) {
        console.error(event.data.data)
        return
      }

      const customEvent = new CustomEvent(event.data.id, { detail: event.data })
      window.dispatchEvent(customEvent)
    })

    this.checkBackend()
    .then((result) => {
      if (result) {
        return this.initEngine()
      } else {
        this.alert?.display([
          '対応しない動作環境です',
          'ご利用の環境ではウェブワーカー上でWebGPUとWebGLのいずれも利用できません'
        ])
        return Promise.reject()
      }
    })
    .then(() => {
      dispatchEvent('engine:ready')
      this.loadUserDictIntoEngine()
    })
    .catch((_) => {})
  },
  render() {
    return (
      <div
        id="editor"
        class={`
          h-[calc(100%-3.5rem)] flex-col gap-4
          ${((this.storage?.project !== undefined) && (this.storage?.project !== null)) ? 'flex' : 'hidden'}
        `}
      >
        <div class="h-[calc(100%-240px-1rem)] flex gap-4">
          <Texts
            storage={ this.storage }
            synthConfig={ this.synthConfig }
            speakerId={ this.speakerId }
            textDataId={ this.textDataId }
            speakerNames={ this.speakerNames }
            speakerImages={ this.speakerImages }
            onSelect={(textDataId) => {
              if ((this.storage === null) || (this.storage.project === null)) return

              const found = this.storage.project.textData.find((data) => data.id === textDataId)
              if (found === undefined) return

              this.synthConfig = structuredClone(toRaw(found.synthConfig))
              this.presetId = presetsDefault.id
              this.textDataId = textDataId
            }}
            onUnselect={() => this.textDataId = null}
            onChangeSpeaker={({textDataId, speakerId}) => {
              if ((this.storage === null) || (this.storage.project === null)) return

              const found = this.storage.project.textData.find((data) => data.id === textDataId)
              if (found === undefined) return

              found.speakerId = speakerId
            }}
            onRemove={(textDataId) => this.removeVoiceCache(textDataId)}
          ></Texts>
          <SynthConfig
            storage={ this.storage }
            synthConfig={ this.synthConfig }
            presetId={ this.presetId }
            onChangePreset={(presetId) => this.setPreset(presetId)}
            onChangeConfig={() => {
              this.presetId = presetsDefault.id

              if (this.textData === null) return

              if (
                (this.textData.synthConfig.speed   !== this.synthConfig.speed)   ||
                (this.textData.synthConfig.volume  !== this.synthConfig.volume)  ||
                (this.textData.synthConfig.pitch   !== this.synthConfig.pitch)   ||
                (this.textData.synthConfig.whisper !== this.synthConfig.whisper)
              ) {
                this.textData.synthConfig = structuredClone(toRaw(this.synthConfig))
              }
            }}
          ></SynthConfig>
        </div>
        <Adjuster
          textData={ this.textData }
          onChange={(textData) => {
            if (this.textData === null) return
            this.textData.kanaData = textData.kanaData
          }}
        ></Adjuster>
        <PresetRegister
          ref="presetRegister"
          onRegister={(presetName) => {
            this.registerPreset(presetName)
            this.closePresetRegister()
          }}
          onCancel={() => this.closePresetRegister()}
        ></PresetRegister>
      </div>
    )
  }
})
