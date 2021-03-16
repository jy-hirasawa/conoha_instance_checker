import 'dotenv/config'

import { IncomingWebhook } from '@slack/webhook'
import { Block, KnownBlock } from '@slack/types'

/**
 * webhook生成
 */
export const webhook: IncomingWebhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL || '')

/**
 * リカバー通知
 */
export const getBlockRecover = (serverName: string, status: string): (KnownBlock | Block)[] => {
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: serverName + 'のVPN状態が' + status + 'に変わりました。'
            }
        }
    ]
}
