import 'dotenv/config'
import moment from 'moment-timezone'
import { IncomingWebhook } from '@slack/webhook'
import { Block, KnownBlock } from '@slack/types'

// noinspection JSUnresolvedFunction
moment.tz.setDefault('Asia/Tokyo')

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
                    moment(updated).format('YYYY/MM/DD HH:mm:ss') +
                    ')'
            }
        }
    ]
}
