import React from 'react';
import { Card } from 'antd';
import {searchLogs, getDepositValue} from '../Contract/Contract'
import { Layout, Button, Input, Steps, message} from 'antd';
const Search = Input.Search;

export class MakePayment extends React.Component {
    async payment(value) {

        console.log(value)
    }
    render() {
    return <Search
        placeholder="value in QTUM"
        enterButton="Make a payment"
        size="large"
        onSearch={value => this.payment(value)}
      />
    }
}
