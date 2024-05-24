import consola from 'consola'
import axios, { AxiosResponse } from 'axios'
import 'dotenv/config'
import * as fs from 'fs'
import { getBlockRecover, webhook } from '../modules/slack'
import * as process from 'node:process'

/**
 * Identity
 * tokens
 */
const getTokens = async (): Promise<AxiosResponse> => {
    let url = ''
    switch (process.env.API_VERSION) {
        case 'v3':
            url = process.env.API_IDENTITY_SERVICE + '/auth/tokens'
            return await axios.post(url, {
                auth: {
                    identity: {
                        methods: ['password'],
                        password: {
                            user: {
                                id: process.env.API_USERID,
                                password: process.env.API_PASSWORD
                            }
                        }
                    },
                    scope: {
                        project: {
                            id: process.env.TENANT_ID
                        }
                    }
                }
            })
        default: // v2
            url = process.env.API_IDENTITY_SERVICE + '/tokens'
            return await axios.post(url, {
                auth: {
                    passwordCredentials: { username: process.env.API_USERNAME, password: process.env.API_PASSWORD },
                    tenantId: process.env.TENANT_ID
                }
            })
    }
}
const parseTokens = async (responseTokens: AxiosResponse) => {
    switch (process.env.API_VERSION) {
        case 'v3':
            return responseTokens.headers['x-subject-token']
        default: // v2
            return String(responseTokens.data.access.token.id)
    }
}

/**
 * Compute
 * servers
 */
const getServers = async (token: string): Promise<AxiosResponse> => {
    const url = process.env.API_COMPUTE_SERVICE + '/servers'
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
    let url = ''
    switch (process.env.API_VERSION) {
        case 'v3':
            url = process.env.API_COMPUTE_SERVICE + '/servers/' + serverId
            return await axios.get(url, {
                headers: {
                    'X-Auth-Token': token
                }
            })
        default: // v2
            url = process.env.API_COMPUTE_SERVICE + '/servers/' + serverId
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
}

;(async () => {
    try {
        // トークン情報取得
        const responseTokens: AxiosResponse = await getTokens()
        // トークン取得
        const token = await parseTokens(responseTokens)

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
