import { defineComponent, toRaw } from 'vue'
import type { PropType } from 'vue'
import { createStorage } from 'unstorage'
import type { Storage as Unstorage } from 'unstorage'
import indexedDbDriver from 'unstorage/drivers/indexedb'
import { z } from 'zod'
import { schemata } from 'poinotalk-engine'
import config from '../config'
import { checkType, uuid, now, downloadFile, readFile, dispatchEvent } from '../utils'
import type { AlertInstance } from './alert'

export interface ExtendedKanaData extends schemata.KanaData {
  lengthRatios: number[]
}

export interface TextData {
  id:          string
  text:        string
  kanaData:    ExtendedKanaData[]
  speakerId:   schemata.SpeakerIdEnum
  synthConfig: schemata.SynthConfig
}

export interface Project {
  id:       string
  textData: TextData[]
}

export interface ProjectInfo {
  id:   string
  name: string
  date: number
}

export interface ProjectHistory {
  array: Project[]
  index: number
}

export interface Preset {
  id:     string
  name:   string
  config: schemata.SynthConfig
}

export interface KeyboardShortcuts {
  [key: string]: {
    code:  string
    alt:   boolean
    shift: boolean
    desc:  string
  }
}

export interface Settings {
  projectInfo:       ProjectInfo[]
  userDict:          schemata.OptiDict
  presets:           Preset[]
  presetsDefault:    Preset
  keyboardShortcuts: KeyboardShortcuts
  licenseAgreed:     boolean
}

export interface DataForExport {
  settings: Settings
  projects: Project[]
}

export const keyboardShortcutsDefault: KeyboardShortcuts = {
  'new': {
    code:  'KeyJ',
    alt:   false,
    shift: false,
    desc:  'プロジェクト及びテキストを追加'
  },
  'settings':      {
    code:  'KeyI',
    alt:   false,
    shift: false,
    desc:  '設定を開く'
  },
  'help': {
    code:  'KeyH',
    alt:   false,
    shift: false,
    desc:  'ヘルプを開く'
  },
  'undo': {
    code:  'KeyZ',
    alt:   false,
    shift: false,
    desc:  '元に戻す'
  },
  'redo': {
    code:  'KeyY',
    alt:   false,
    shift: false,
    desc:  'やり直す'
  },
  'projects': {
    code:  'KeyL',
    alt:   false,
    shift: false,
    desc:  'プロジェクト一覧に戻る'
  },
  'play': {
    code:  'Space',
    alt:   false,
    shift: false,
    desc:  '音声の再生'
  },
  'play:all': {
    code:  'Space',
    alt:   false,
    shift: true,
    desc:  '音声の連続再生'
  },
  'save': {
    code:  'KeyS',
    alt:   false,
    shift: false,
    desc:  '音声の保存'
  },
  'save:all': {
    code:  'KeyS',
    alt:   false,
    shift: true,
    desc:  '音声の一括保存'
  },
  'dict': {
    code:  'KeyD',
    alt:   false,
    shift: false,
    desc:  '辞書一覧を開く'
  },
  'preset': {
    code:  'KeyP',
    alt:   false,
    shift: false,
    desc:  'プリセット一覧を開く'
  },
  'remove': {
    code:  'KeyK',
    alt:   false,
    shift: true,
    desc:  'テキストを削除'
  }
} as const

const extendedKanaDataSchema = schemata.kanaDataArraySchema.element.extend({
  lengthRatios: z.array(z.number())
})

export const textDataSchema = z.object({
  id:          z.string().uuid(),
  text:        z.string(),
  kanaData:    z.array(extendedKanaDataSchema),
  speakerId:   schemata.speakerIdEnumSchema,
  synthConfig: schemata.synthConfigSchema
})

export const projectSchema = z.object({
  id:       z.string().uuid(),
  textData: z.array(textDataSchema)
})

export const projectInfoSchema = z.object({
  id:   z.string().uuid(),
  name: z.string(),
  date: z.number()
})

export const presetSchema = z.object({
  id:     z.string().uuid(),
  name:   z.string(),
  config: schemata.synthConfigSchema
})

export const presetDefaultSchema = z.object({
  id:     z.literal('default'),
  name:   z.literal('デフォルト'),
  config: z.object({
    speed:   z.literal(1.0),
    volume:  z.literal(0.5),
    pitch:   z.literal(1.0),
    whisper: z.literal(false)
  })
})

export const keyboardShortcutSchema = z.object({
  code:  z.string(),
  alt:   z.boolean(),
  shift: z.boolean(),
  desc:  z.string()
})

export const keyboardShortcutsSchema = z.object(
  Object.fromEntries(
    Object.keys(keyboardShortcutsDefault).map((key) => {
      return [key, keyboardShortcutSchema]
    })
  )
)

export const settingsSchema = z.object({
  projectInfo:       z.array(projectInfoSchema),
  userDict:          schemata.optiDictSchema,
  presets:           z.array(presetSchema),
  presetsDefault:    presetDefaultSchema,
  keyboardShortcuts: keyboardShortcutsSchema,
  licenseAgreed:     z.boolean()
})

export const dataForExportSchema = z.object({
  settings: settingsSchema,
  projects: z.array(projectSchema)
})

export const presetsDefault: Preset = {
  id:   'default',
  name: 'デフォルト',
  config: {
    speed:   1.0,
    volume:  0.5,
    pitch:   1.0,
    whisper: false
  }
} as const

export const settingsDefault: Settings = {
  projectInfo:       [],
  userDict:          {},
  presets:           [],
  presetsDefault:    presetsDefault,
  keyboardShortcuts: keyboardShortcutsDefault,
  licenseAgreed:     false
} as const

export const projectHistoryDefault: ProjectHistory = {
  array: [],
  index: -1
} as const

checkType<TextData>(textDataSchema)
checkType<Project>(projectSchema)
checkType<ProjectInfo>(projectInfoSchema)
checkType<Preset>(presetSchema)
checkType<Preset>(presetDefaultSchema)
checkType<KeyboardShortcuts[number]>(keyboardShortcutSchema)
checkType<KeyboardShortcuts>(keyboardShortcutsSchema)
checkType<Settings>(settingsSchema)
checkType<DataForExport>(dataForExportSchema)

const component = defineComponent({
  data(): {
    storage: Unstorage
    settingsKey: string
    settings: Settings
    project: Project | null
    projectHistory: ProjectHistory
    settingsSaved: boolean
    projectSaved: boolean
    skipAddingHistory: boolean
    textDataJsons: { [key: string]: string }
  } {
    return {
      storage: createStorage({
        driver: indexedDbDriver({
          dbName: `${config.appName}-${config.version}`,
          storeName: 'kvs'
        })
      }),
      settingsKey: 'settings',
      settings: structuredClone(settingsDefault),
      project: null,
      projectHistory: structuredClone(projectHistoryDefault),
      settingsSaved: true,
      projectSaved: true,
      skipAddingHistory: false,
      textDataJsons: {},
    }
  },
  props: {
    alert: {
      type: [Object, null] as PropType<AlertInstance | null>,
      required: true
    }
  },
  methods: {
    loadSettings() {
      return new Promise<void>((resolve, reject) => {
        this.storage.getItem<Settings>(this.settingsKey)
        .then((settings) => {
          if (settings !== null) {
            settingsSchema.parse(settings)
            this.settings = settings
          }

          resolve()
        })
        .catch(reject)
      })
    },
    loadProject(projectId: string) {
      return new Promise<void>((resolve, reject) => {
        this.storage.getItem<Project>(projectId)
        .then((project) => {
          if (project !== null) {
            projectSchema.parse(project)
            this.project = project
            this.resetProjectHistory(this.project)

            this.settings.projectInfo
            .filter((info) => info.id === projectId)
            .forEach((info) => info.date = now())
          }

          resolve()
        })
        .catch(reject)
      })
    },
    getProject(projectId: string) {
      return new Promise<Project | null>((resolve, reject) => {
        this.storage.getItem<Project>(projectId)
        .then((project) => {
          if (project === null) {
            resolve(null)
          } else {
            projectSchema.parse(project)
            resolve(project)
          }
        })
        .catch(reject)
      })
    },
    unloadProject() {
      this.project = null
      this.resetProjectHistory()
      this.textDataJsons = {}
    },
    saveSettings() {
      return new Promise<void>((resolve, reject) => {
        const raw = toRaw(this.settings)

        Promise.resolve()
        .then(() => settingsSchema.parse(raw))
        .then(() => this.storage.setItem<Settings>(this.settingsKey, raw))
        .then(() => {
          this.settingsSaved = true
          console.log('settings:save')
          resolve()
        })
        .catch(reject)
      })
    },
    saveProject() {
      return new Promise<void>((resolve, reject) => {
        if (this.project === null) {
          this.projectSaved = true
          resolve()
          return
        }

        const raw = toRaw(this.project)

        Promise.resolve()
        .then(() => projectSchema.parse(raw))
        .then(() => this.storage.setItem<Project>(raw.id, raw))
        .then(() => {
          this.projectSaved = true
          console.log('project:save')
          resolve()
        })
        .catch(reject)
      })
    },
    setProject(project: Project) {
      return new Promise<void>((resolve, reject) => {
        const raw = toRaw(project)

        Promise.resolve()
        .then(() => projectSchema.parse(raw))
        .then(() => this.storage.setItem<Project>(raw.id, raw))
        .then(() => resolve())
        .catch(reject)
      })
    },
    addProject(projectName: string) {
      const projectId = uuid()

      this.settings.projectInfo.push({
        id:   projectId,
        name: projectName,
        date: now()
      })

      this.project = {
        id:       projectId,
        textData: []
      }

      this.resetProjectHistory(this.project)
    },
    removeProject(projectId: string) {
      const filtered = this.settings.projectInfo.filter((info) => info.id !== projectId)
      this.settings.projectInfo = filtered

      if ((this.project !== null) && (this.project.id === projectId)) {
        this.unloadProject()
      }

      return new Promise<void>((resolve, reject) => {
        this.storage.removeItem(projectId)
        .then(() => resolve())
        .catch(reject)
      })
    },
    renameProject(projectId: string, newName: string) {
      this.settings.projectInfo
      .filter((info) => info.id === projectId)
      .forEach((info) => info.name = newName)
    },
    undo() {
      if (this.projectHistory.index <= 0) return

      this.skipAddingNextHistory()
      this.projectHistory.index--
      const clone = structuredClone(
        toRaw(this.projectHistory.array[this.projectHistory.index])
      )
      this.project = clone
      console.log('project:undo')
    },
    redo() {
      if (this.projectHistory.index >= (this.projectHistory.array.length - 1)) return

      this.skipAddingNextHistory()
      this.projectHistory.index++
      const clone = structuredClone(
        toRaw(this.projectHistory.array[this.projectHistory.index])
      )
      this.project = clone
      console.log('project:redo')
    },
    export() {
      const data: DataForExport = {
        settings: structuredClone(toRaw(this.settings)),
        projects: []
      }

      let failedGetProjects = true

      Promise.allSettled(
        this.settings.projectInfo.map(({id}) => {
          return this.getProject(id)
        })
      )
      .then((results) => {
        failedGetProjects = results.some((result) => (
          (result.status === 'rejected') ||
          ((result.status === 'fulfilled') && (result.value === null))
        ))

        data.projects = (
          results
          .map((result) => (result.status === 'fulfilled') ? result.value : null)
          .filter((value) => value !== null)
        ) as Project[]

        const projectIds = data.projects.map((project) => project.id)
        const filtered = data.settings.projectInfo.filter((info) => projectIds.includes(info.id))
        data.settings.projectInfo = filtered

        const json = JSON.stringify(data)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const fileName = `${config.appName}_data.json`

        downloadFile(fileName, url)
        setTimeout(() => URL.revokeObjectURL(url), 1000 * 10)

        if (failedGetProjects) {
          this.alert?.display([
            '一部のプロジェクトデータのエクスポートに失敗しました',
            '繰り返し表示される場合はプロジェクトデータが破損している可能性があります'
          ])
        }
      })
      .catch((e) => {
        console.error(e)

        this.alert?.display([
          '保存データのエクスポートに失敗しました',
          '繰り返し表示される場合はページを再読み込みしてください',
          String(e)
        ])
      })
    },
    import(file: File) {
      let data: DataForExport
      let missingProjectIds = true

      readFile(file, 'text')
      .then((json) => {
        const parsed = JSON.parse(json as string)
        dataForExportSchema.parse(parsed)
        data = parsed as DataForExport

        const projectIds = data.projects.map((project) => project.id)
        const projectInfoIds = data.settings.projectInfo.map((info) => info.id)

        missingProjectIds = (
          data.settings.projectInfo.some((info) => !projectIds.includes(info.id)) ||
          data.projects.some((project) => !projectInfoIds.includes(project.id))
        )

        data.settings.projectInfo = data.settings.projectInfo.filter((info) => projectIds.includes(info.id))
        data.projects = data.projects.filter((project) => projectInfoIds.includes(project.id))

        this.unloadProject()
        return this.clear()
      })
      .then(() => {
        return Promise.all(data.projects.map((project) => this.setProject(project)))
      })
      .then(() => {
        data.settings.licenseAgreed = this.settings.licenseAgreed
        this.settings = data.settings

        if (missingProjectIds) {
          this.alert?.display([
            '一部のプロジェクトデータのインポートに失敗しました',
            '繰り返し表示される場合はファイルが破損している可能性があります'
          ])
        }
      })
      .catch((e) => {
        console.error(e)

        this.alert?.display([
          '保存データのインポートに失敗しました',
          '繰り返し表示される場合はファイルが破損している可能性があります',
          String(e)
        ])
      })
    },
    startUnloadBlocker() {
      window.addEventListener('beforeunload', (event) => {
        if (!this.settingsSaved || !this.projectSaved) {
          event.preventDefault()
        }
      })
    },
    resetProjectHistory(project: Project | null = null) {
      if (project === null) {
        this.projectHistory = structuredClone(projectHistoryDefault)
      } else {
        this.projectHistory = {
          array: [structuredClone(toRaw(project))],
          index: 0
        }
      }
    },
    addProjectHistory() {
      if (this.project === null) return

      const clone = structuredClone(toRaw(this.project))
      this.projectHistory.array.splice(this.projectHistory.index + 1)
      this.projectHistory.array.push(clone)
      this.projectHistory.index++

      console.log('project:history:add')
    },
    clear() {
      return this.storage.clear()
    },
    skipAddingNextHistory() {
      this.skipAddingHistory = true
    },
    checkTextDataDiff() {
      if (this.project === null) return

      this.project.textData.forEach((data) => {
        const currentJson = JSON.stringify(toRaw(data))
        let prevJson = ''

        if (data.id in this.textDataJsons) {
          prevJson = this.textDataJsons[data.id]
        }

        if (currentJson !== prevJson) {
          dispatchEvent('text:update', {
            textDataId: data.id,
            analyzeText: false
          })
        }

        this.textDataJsons[data.id] = currentJson
      })

      const textDataIds = this.project.textData.map((data) => data.id)
      const nonExistentKeys = Object.keys(this.textDataJsons).filter((key) => !textDataIds.includes(key))

      nonExistentKeys.forEach((key) => delete this.textDataJsons[key])
    }
  },
  watch: {
    settings: {
      handler() {
        this.settingsSaved = false

        this.saveSettings()
        .catch((e) => {
          console.error(e)

          this.alert?.display([
            '設定の保存に失敗しました',
            '繰り返し表示される場合はページを再読み込みしてください',
            String(e)
          ])
        })
      },
      deep: true
    },
    project: {
      handler() {
        this.projectSaved = false

        this.saveProject()
        .catch((e) => {
          console.error(e)

          this.alert?.display([
            'プロジェクトの保存に失敗しました',
            '繰り返し表示される場合はページを再読み込みしてください',
            String(e)
          ])
        })

        this.checkTextDataDiff()

        if (this.skipAddingHistory) {
          this.skipAddingHistory = false
          return
        }

        this.addProjectHistory()
      },
      deep: true
    }
  },
  mounted() {
    this.startUnloadBlocker()
  },
  render() {
    return <></>
  }
})

export default component
export type StorageInstance = InstanceType<typeof component>
