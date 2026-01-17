import React, { Component } from 'react';
import styles from './SideBar.module.scss';

class SideBar extends Component {
    render() {
        return (
            <div className={styles.container}>
                <h3 className={styles.title}>Trade Statistics</h3>
                <div className={styles.item}>
                    <span className={styles.label}>Buy Trades</span>
                    <span className={styles.value}>{this.props.buyCount}</span>
                </div>
                <div className={styles.item}>
                    <span className={styles.label}>Sell Trades</span>
                    <span className={styles.value}>{this.props.sellCount}</span>
                </div>

                <h3 className={styles.title} style={{marginTop: '30px'}}>Market Prices (USD)</h3>
                <div className={styles.item}>
                    <span className={styles.label}>XLM/USD</span>
                    <span className={styles.value}>{this.props.xlmPrice ? "$" + this.props.xlmPrice : "Loading..."}</span>
                </div>
                <div className={styles.item}>
                    <span className={styles.label}>XRP/USD</span>
                    <span className={styles.value}>{this.props.xrpPrice ? "$" + this.props.xrpPrice : "Loading..."}</span>
                </div>
            </div>
        );
    }
}

export default SideBar;
