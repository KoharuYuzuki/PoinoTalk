import { PoinoTalkEngine, schemata, utils } from 'poinotalk-engine'
import { z } from 'zod'
import { checkType } from './utils'
import config from './config'

const engine = new PoinoTalkEngine()
const speakers = engine.getSpeakers()

export interface SynthData {
  analyzedData: schemata.KanaData[]
  speakerId:    schemata.SpeakerIdEnum
  config:       schemata.SynthConfig
}

export type Message = {
  id:   string
  type: 'engine:backend:check'
  data: null
} | {
  id:   string
  type: 'engine:init'
  data: null
} | {
  id:   string
  type: 'engine:dict:load'
  data: schemata.OptiDict
} | {
  id:   string
  type: 'engine:dict:clear'
  data: null
} | {
  id:   string
  type: 'engine:analyze'
  data: string
} | {
  id:   string
  type: 'engine:synth'
  data: SynthData
}

const synthDataSchema = z.object({
  analyzedData: schemata.kanaDataArraySchema,
  speakerId:    schemata.speakerIdEnumSchema,
  config:       schemata.synthConfigSchema
})

const messageSchema = z.union([
  z.object({
    id:   z.string(),
    type: z.literal('engine:backend:check'),
    data: z.null()
  }),
  z.object({
    id:   z.string(),
    type: z.literal('engine:init'),
    data: z.null()
  }),
  z.object({
    id:   z.string(),
    type: z.literal('engine:dict:load'),
    data: schemata.optiDictSchema
  }),
  z.object({
    id:   z.string(),
    type: z.literal('engine:dict:clear'),
    data: z.null()
  }),
  z.object({
    id:   z.string(),
    type: z.literal('engine:analyze'),
    data: z.string()
  }),
  z.object({
    id:   z.string(),
    type: z.literal('engine:synth'),
    data: synthDataSchema
  })
])

checkType<SynthData>(synthDataSchema)
checkType<Message>(messageSchema)

const dictFileNames = [
  'char.bin',
  'left-id.def',
  'matrix.bin',
  'pos-id.def',
  'rewrite.def',
  'right-id.def',
  'unk.dic'
]

const dictSegumentFileNames = [
  'sys-1.dic',
  'sys-2.dic',
  'sys-3.dic',
  'sys-4.dic',
  'sys-5.dic',
  'sys-6.dic',
  'sys-7.dic',
  'sys-8.dic',
  'sys-9.dic',
  'sys-10.dic',
  'sys-11.dic',
  'sys-12.dic',
  'sys-13.dic',
  'sys-14.dic',
  'sys-15.dic',
  'sys-16.dic',
  'sys-17.dic',
  'sys-18.dic',
  'sys-19.dic',
  'sys-20.dic',
  'sys-21.dic'
]

function checkBackend (id: string) {
  try {
    const result = utils.canUseWebGPU || utils.canUseWebGL
    postMessage(id, true, result)
  } catch (e) {
    console.error(e)
    postMessage(id, false, e)
  }
}

function init (id: string) {
  try {
    engine.init()
    .then(() => {
      const promises = dictFileNames.map((fileName) => {
        return new Promise<{ fileName: string, data: Uint8Array }>((resolve, reject) => {
          const url = new URL(fileName, config.openjlabelDictDirURL).href
          fetch(url, { cache: 'force-cache' })
          .then((res) => res.arrayBuffer())
          .then((arrayBuffer) => {
            const buffer = new Uint8Array(arrayBuffer)
            resolve({
              fileName: fileName,
              data: buffer
            })
          })
          .catch(reject)
        })
      })

      const promise = new Promise<{ fileName: string, data: Uint8Array }>((resolve, reject) => {
        const promises = dictSegumentFileNames.map((fileName) => {
          return new Promise<Uint8Array>((resolve, reject) => {
            const url = new URL(fileName, config.openjlabelDictDirURL).href
            fetch(url, { cache: 'force-cache' })
            .then((res) => res.arrayBuffer())
            .then((arrayBuffer) => {
              const buffer = new Uint8Array(arrayBuffer)
              resolve(buffer)
            })
            .catch(reject)
          })
        })

        Promise.all(promises)
        .then((buffers) => {
          const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0)
          const buffer = new Uint8Array(totalLength)
          let prevEnd = 0

          for (let i = 0; i < buffers.length; i++) {
            buffer.set(buffers[i], prevEnd)
            prevEnd += buffers[i].length
          }

          resolve({
            fileName: 'sys.dic',
            data: buffer
          })
        })
        .catch(reject)
      })

      return Promise.all([...promises, promise])
    })
    .then((files) => (
      engine.loadOpenjlabelDict(files)
    ))
    .then(() => (
      engine.loadMlModels(
        {
          duration: new URL('duration/model.json', config.mlModelsDirURL).href,
          f0:       new URL('f0/model.json',       config.mlModelsDirURL).href,
          volume:   new URL('volume/model.json',   config.mlModelsDirURL).href
        },
        {
          slidingWinLen:   config.mlModelOptions.slidingWinLen,
          f0ModelBaseFreq: config.mlModelOptions.f0ModelBaseFreq,
          f0NormMax:       config.mlModelOptions.f0NormMax
        }
      )
    ))
    .then(() => {
      postMessage(id, true, null)
    })
  } catch (e) {
    console.error(e)
    postMessage(id, false, e)
  }
}

function loadDict (id: string, dict: schemata.OptiDict) {
  try {
    engine.loadUserDict(dict)
    postMessage(id, true, null)
  } catch (e) {
    console.error(e)
    postMessage(id, false, e)
  }
}

function clearDict (id: string) {
  try {
    engine.clearUserDict()
    postMessage(id, true, null)
  } catch (e) {
    console.error(e)
    postMessage(id, false, e)
  }
}

function analyzeText (id: string, text: string) {
  try {
    engine.analyzeText(text)
    .then((analyzed) => {
      postMessage(id, true, analyzed)
    })
  } catch (e) {
    console.error(e)
    postMessage(id, false, e)
  }
}

function synthVoice (id: string, data: SynthData) {
  try {
    engine.synthesizeVoice(
      data.analyzedData,
      speakers[data.speakerId],
      data.config
    )
    .then((wav) => {
      postMessage(id, true, wav)
    })
  } catch (e) {
    console.error(e)
    postMessage(id, false, e)
  }
}

function postMessage (id: string | null, success: boolean, data: any) {
  self.postMessage({
    id:   id,
    type: success ? 'success' : 'error',
    data: data
  })
}

self.addEventListener('message', (event) => {
  const result = messageSchema.safeParse(event.data)

  if (!result.success) {
    postMessage(null, false, result.error)
    return
  }

  const message = event.data as Message

  switch (message.type) {
    case 'engine:backend:check':
      checkBackend(message.id)
      break
    case 'engine:init':
      init(message.id)
      break
    case 'engine:dict:load':
      loadDict(message.id, message.data)
      break
    case 'engine:dict:clear':
      clearDict(message.id)
      break
    case 'engine:analyze':
      analyzeText(message.id, message.data)
      break
    case 'engine:synth':
      synthVoice(message.id, message.data)
      break
  }
})

export default {}
