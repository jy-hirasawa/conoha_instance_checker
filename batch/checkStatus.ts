import consola from 'consola'
import axios, { AxiosResponse } from 'axios'
import 'dotenv/config'
import * as fs from 'fs'
import { getBlockRecover, webhook } from '../modules/slack'

/**
 * Identity
 * tokens
 */
const getTokens = async (): Promise<AxiosResponse> => {
    const url = 'https://identity.tyo1.conoha.io/v2.0/tokens'
    return await axios.post(url, {
        auth: {
            passwordCredentials: { username: process.env.API_USERNAME, password: process.env.API_PASSWORD },
            tenantId: process.env.TENANT_ID
        }
    })
}

/**
 * Compute
 * servers
 */
const getServers = async (token: string): Promise<AxiosResponse> => {
    const url: string = 'https://compute.tyo1.conoha.io/v2/' + process.env.TENANT_ID + '/servers'
    return await axios.get(url, {
        headers: {
            'X-Auth-Token': token
        }
    })
}

/**
 * Compute
 * servers/{server_id}
 */
const getStatus = async (token: string, serverId: string): Promise<AxiosResponse> => {
    const url: string = 'https://compute.tyo1.conoha.io/v2/' + process.env.TENANT_ID + '/servers/' + serverId
    return await axios.get(url, {
        headers: {
            'X-Auth-Token': token
        },
        params: {
            auth: {
                passwordCredentials: { username: process.env.API_USERNAME, password: process.env.API_PASSWORD },
                tenantId: process.env.TENANT_ID
            }
        }
    })
}

;(async () => {
    try {
        // トークン取得
        const responseTokens: AxiosResponse = await getTokens()
        const token = String(responseTokens.data.access.token.id)

        // サーバー一覧取得
        const responseServers: AxiosResponse = await getServers(token)
        const serves: string[] = responseServers.data.servers.map((server: { id: string }) => {
            return server.id
        })

        // 各サーバーのステータス確認
        for (const serverId of serves) {
            // 各ステータスの記録ファイル
            const statusFile = 'status/' + serverId + '.json'
            // 前回のステータス
            let preStatus: { status: string }
            // ファイル未作成の状態をcatchで処理
            try {
                preStatus = require(statusFile)
            } catch (e) {
                preStatus = { status: '' }
            }

            // サーバー状態取得
            const responseStatus: AxiosResponse = await getStatus(token, serverId)
            const server: { status: string; updated: string; metadata: { instance_name_tag: string } } =
                responseStatus.data.server

            // ステータスの確認
            if (server.status !== preStatus.status) {
                consola.log('%s -> %s', preStatus.status, server.status)
                // slackに通知
                const blocks = getBlockRecover(server.metadata.instance_name_tag, server.status, server.updated)
                await webhook.send({ blocks })

                // 現在のステータスを書き出し
                const status = { status: server.status }
                fs.writeFile(statusFile, JSON.stringify(status), (err) => {
                    if (err) throw err
                })
            }
        }
    } catch (e) {
        consola.fatal(e)
    }
})()
