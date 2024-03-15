import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance } from './storage'
import config from '../config'
import { dispatchEvent } from '../utils'

export default defineComponent({
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  render() {
    return (
      <div
        id="menu"
        class="h-10 rounded-[1.25rem] bg-accent flex justify-between items-center gap-4 shrink-0"
      >
        <div class="flex items-center gap-4">
          <div class="ml-1 flex items-center gap-0.5">
            <div class="w-10 h-10 bg-main [mask-image:url(./assets/icon.svg)]"></div>
            <p class="text-light">{ config.appName }</p>
          </div>
          {
            (
              (this.storage?.project === undefined) ||
              (this.storage?.project === null)
            ) ? (
              <>
                <button onClick={() => dispatchEvent('project:new')}>
                  <p class="text-light text-sm">新規プロジェクト</p>
                </button>
                <button onClick={() => dispatchEvent('settings:open')}>
                  <p class="text-light text-sm">設定</p>
                </button>
              </>
            ) : (
              <button onClick={() => dispatchEvent('project:list')}>
                <p class="text-light text-sm">プロジェクト一覧</p>
              </button>
            )
          }
          {
            (
              (this.storage?.project !== undefined) &&
              (this.storage?.project !== null)
            ) ? (
              <>
                <button onClick={() => dispatchEvent('text:play:all')}>
                  <p class="text-light text-sm">連続再生</p>
                </button>
                <button onClick={() => dispatchEvent('text:save:all')}>
                  <p class="text-light text-sm">一括書き出し</p>
                </button>
                <button onClick={() => dispatchEvent('editor:undo')}>
                  <p class="text-light text-sm">元に戻す</p>
                </button>
                <button onClick={() => dispatchEvent('editor:redo')}>
                  <p class="text-light text-sm">やり直す</p>
                </button>
                <button onClick={() => dispatchEvent('dict:list')}>
                  <p class="text-light text-sm">辞書</p>
                </button>
                <button onClick={() => dispatchEvent('preset:list')}>
                  <p class="text-light text-sm">プリセット</p>
                </button>
              </>
            ) : (
              <></>
            )
          }
          <button onClick={() => dispatchEvent('help:open')}>
            <p class="text-light text-sm">ヘルプ</p>
          </button>
        </div>
        <div class="flex items-center gap-4">
          <p class="text-light mr-4">{ config.version }</p>
        </div>
      </div>
    )
  }
})
