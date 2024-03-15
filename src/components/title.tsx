import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance } from './storage'
import config from '../config'

export default defineComponent({
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  methods: {
    setTitle(title: string) {
      document.title = title
    }
  },
  watch: {
    'storage.project'() {
      if (this.storage === null) {
        this.setTitle(config.appName)
        return
      }

      if (this.storage.project === null) {
        this.setTitle(`${config.appName} | プロジェクト一覧`)
      } else {
        const id = this.storage.project.id
        const found = this.storage.settings.projectInfo.find((info) => info.id === id)

        if (found === undefined) {
          this.setTitle(`${config.appName} | 不明なプロジェクト`)
        } else {
          this.setTitle(`${config.appName} | ${found.name}`)
        }
      }
    }
  },
  mounted() {
    this.setTitle(`${config.appName} | プロジェクト一覧`)
  },
  render() {
    return <></>
  }
})
