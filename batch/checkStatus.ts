import consola from 'consola'
import axios, { AxiosResponse } from 'axios'
import 'dotenv/config'
import * as fs from 'fs'
import { getBlockRecover, webhook } from '../modules/slack'

const getToken = async (): Promise<AxiosResponse> => {
    const url = 'https://identity.tyo1.conoha.io/v2.0/tokens'
    return await axios.post(url, {
        auth: {
            passwordCredentials: { username: process.env.API_USERNAME, password: process.env.API_PASSWORD },
            tenantId: process.env.TENANT_ID
        }
    })
}

const getStatus = async (token: string, serverId: string): Promise<AxiosResponse> => {
    const url = 'https://compute.tyo1.conoha.io/v2/' + process.env.TENANT_ID + '/servers/' + serverId

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
        const SERVER_ID = process.argv[2]

        let preStatus: { status: string }
        try {
            preStatus = require('status/' + SERVER_ID + '.json')
        } catch (e) {
            preStatus = { status: '' }
        }

        // トークン取得
        const responseToken: AxiosResponse = await getToken()
        const token: string = String(responseToken.data.access.token.id)

        // サーバー状態取得
        const responseStatus: AxiosResponse = await getStatus(token, SERVER_ID)
        const server: any = responseStatus.data.server
        consola.log(server)

        if (server.status !== preStatus.status) {
            const blocks = getBlockRecover(server.metadata.instance_name_tag, server.status)
            await webhook.send({ blocks })

            const status = { status: server.status }
            fs.writeFile('status/' + SERVER_ID + '.json', JSON.stringify(status), (err) => {
                if (err) throw err
                consola.log('正常に書き込みが完了しました')
            })
        }
    } catch (e) {
        consola.fatal(e)
    }
})()
