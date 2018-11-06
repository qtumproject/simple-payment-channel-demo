import React from 'react';
import { Card } from 'antd';
import {searchLogs, getDepositValue, claim} from '../Contract/Contract'
import { Layout, Button, Input, Steps, message} from 'antd';

export class Claim extends React.Component {
    async claim() {
        const {account, payment} = this.props
        const {qweb3, contract, address} = account

        await claim(qweb3, contract, address, payment)
    }

    render() {
        return <Button type="primary" onClick={() => this.claim()}>Claim</Button>
    }
}
