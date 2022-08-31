import 'dotenv/config'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ja'
import { IncomingWebhook } from '@slack/webhook'
import { Block, KnownBlock } from '@slack/types'
// noinspection JSUnresolvedFunction
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Tokyo')
dayjs.locale('ja')

/**
 * webhook生成
 */
export const webhook: IncomingWebhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL || '')

/**
 * リカバー通知
 */
export const getBlockRecover = (serverName: string, status: string, updated: string): (KnownBlock | Block)[] => {
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text:
                    serverName +
                    'のVPS状態が' +
                    status +
                    'に変わりました。(' +
                    dayjs(updated).format('YYYY/MM/DD HH:mm:ss') +
                    ')'
            }
        }
    ]
}
