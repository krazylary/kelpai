import React, { Component } from 'react';
import Form from '../../molecules/Form/Form';
import getBotConfig from '../../../kelp-ops-api/getBotConfig';
import getNewBotConfig from '../../../kelp-ops-api/getNewBotConfig';
import upsertBotConfig from '../../../kelp-ops-api/upsertBotConfig';
import fetchOptionsMetadata from '../../../kelp-ops-api/fetchOptionsMetadata';
import fetchBotMetrics from '../../../kelp-ops-api/fetchBotMetrics';
import fetchPrice from '../../../kelp-ops-api/fetchPrice';
import LoadingAnimation from '../../atoms/LoadingAnimation/LoadingAnimation';
import SideBar from '../../molecules/SideBar/SideBar';
import grid from '../../_styles/grid.module.scss';

class NewBot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSaving: false,
      configData: null,
      errorResp: null,
      optionsMetadata: null,
      botMetrics: {
        trade_count_buy: 0,
        trade_count_sell: 0,
      },
      xlmPrice: null,
      xrpPrice: null,
    };

    this.saveNew = this.saveNew.bind(this);
    this.saveEdit = this.saveEdit.bind(this);
    this.loadNewConfigData = this.loadNewConfigData.bind(this);
    this.loadBotConfigData = this.loadBotConfigData.bind(this);
    this.onChangeForm = this.onChangeForm.bind(this);
    this.updateUsingDotNotation = this.updateUsingDotNotation.bind(this);
    this.loadOptionsMetadata = this.loadOptionsMetadata.bind(this);
    this.startMetricsPolling = this.startMetricsPolling.bind(this);
    this.fetchMetrics = this.fetchMetrics.bind(this);
    this.fetchCryptoPrices = this.fetchCryptoPrices.bind(this);

    this._asyncRequests = {};
    this.metricsInterval = null;
  }

  componentDidMount() {
    this.loadOptionsMetadata();
  }

  componentWillUnmount() {
    if (this._asyncRequests["botConfig"]) {
      delete this._asyncRequests["botConfig"];
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  startMetricsPolling(botName) {
    this.fetchMetrics(botName);
    this.fetchCryptoPrices();
    this.metricsInterval = setInterval(() => {
      this.fetchMetrics(botName);
      this.fetchCryptoPrices();
    }, 5000);
  }

  fetchCryptoPrices() {
    var _this = this;
    // XLM/USD
    fetchPrice(this.props.baseUrl, "exchange", "kraken/XXLM/ZUSD/mid").then(resp => {
        if (!resp.error) {
            _this.setState({ xlmPrice: resp.price });
        }
    });
    // XRP/USD
    fetchPrice(this.props.baseUrl, "exchange", "kraken/XXRP/ZUSD/mid").then(resp => {
        if (!resp.error) {
            _this.setState({ xrpPrice: resp.price });
        }
    });
  }

  fetchMetrics(botName) {
    var _this = this;
    // Don't track this request in _asyncRequests to avoid blocking unmount logic excessively for background polling
    fetchBotMetrics(this.props.baseUrl, botName).then(resp => {
      if (!resp.error) {
        _this.setState({
          botMetrics: {
            trade_count_buy: resp.trade_count_buy || 0,
            trade_count_sell: resp.trade_count_sell || 0,
          },
        });
      }
    });
  }

  loadOptionsMetadata() {
    if (this._asyncRequests["optionsMetadata"]) {
      return
    }

    var _this = this;
    this._asyncRequests["optionsMetadata"] = fetchOptionsMetadata(this.props.baseUrl).then(optionsMetadata => {
      if (!_this._asyncRequests["optionsMetadata"]) {
        // if it has been deleted it means we don't want to process the result
        return
      }

      delete _this._asyncRequests["optionsMetadata"];
      if (optionsMetadata.hasOwnProperty('error')) {
        console.log("error when loading optionsMetadata: " + optionsMetadata.error);
        setTimeout(_this.loadOptionsMetadata, 1000);
      } else {
        _this.setState(prevState => ({
          optionsMetadata: optionsMetadata,
        }))
      }
    });
  }

  saveNew() {
    // same behavior for now. this will diverge when we allow for editing the name of a bot
    this.saveEdit();
  }

  saveEdit() {
    this.setState({
      isSaving: true,
    });

    var _this = this;
    this._asyncRequests["botConfig"] = upsertBotConfig(this.props.baseUrl, JSON.stringify(this.state.configData)).then(resp => {
      if (!_this._asyncRequests["botConfig"]) {
        // if it has been deleted it means we don't want to process the result
        return
      }

      delete _this._asyncRequests["botConfig"];
      _this.setState({
        isSaving: false,
      });

      if (resp["success"]) {
        _this.props.history.goBack();
      } else if (resp["error"]) {
        _this.setState({
          errorResp: resp,
        });
      } else {
        _this.setState({
          errorResp: { error: "Unknown error while attempting to save bot config" },
        });
      }
    });
  }

  loadNewConfigData() {
    var _this = this;
    this._asyncRequests["botConfig"] = getNewBotConfig(this.props.baseUrl).then(resp => {
      if (!_this._asyncRequests["botConfig"]) {
        // if it has been deleted it means we don't want to process the result
        return
      }
      
      delete _this._asyncRequests["botConfig"];
      _this.setState({
        configData: resp,
      });
    });
  }

  loadBotConfigData(botName) {
    var _this = this;
    this._asyncRequests["botConfig"] = getBotConfig(this.props.baseUrl, botName).then(resp => {
      if (!_this._asyncRequests["botConfig"]) {
        // if it has been deleted it means we don't want to process the result
        return
      }
      
      delete _this._asyncRequests["botConfig"];
      _this.setState({
        configData: resp,
      });
    });
  }

  updateUsingDotNotation(obj, path, newValue) {
    // update correct value by converting from dot notation string
    let parts = path.split('.');

    // maintain reference to original object by creating copy
    let current = obj;

    // fetch the object that contains the field we want to update
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }

    // update the field
    current[parts[parts.length-1]] = newValue;
  }

  onChangeForm(statePath, event, mergeUpdateInstructions) {
    // make copy of current state
    let updateJSON = Object.assign({}, this.state);

    if (statePath) {
      this.updateUsingDotNotation(updateJSON.configData, statePath, event.target.value);
    }

    // merge in any additional updates
    if (mergeUpdateInstructions) {
      let keys = Object.keys(mergeUpdateInstructions)
      for (let i = 0; i < keys.length; i++) {
        let dotNotationKey = keys[i];
        let fn = mergeUpdateInstructions[dotNotationKey];
        let newValue = fn(event.target.value);
        if (newValue != null) {
          this.updateUsingDotNotation(updateJSON.configData, dotNotationKey, newValue);
        }
      }
    }

    // set state for the full state object
    this.setState(updateJSON);
  }

  render() {
    if (this.state.isSaving) {
      return (<LoadingAnimation/>);
    }

    let segmentNetworkOptions = ["TestNet"];
    if (this.props.enablePubnetBots) {
      segmentNetworkOptions.push("PubNet");
    }

    if (this.props.location.pathname === "/new") {
      if (!this.state.configData) {
        this.loadNewConfigData();
        return (<div>Fetching sample config file</div>);
      }
      return (<Form
        router={this.props.history}
        isNew={true}
        baseUrl={this.props.baseUrl}
        title="New Bot"
        segmentNetworkOptions={segmentNetworkOptions}
        optionsMetadata={this.state.optionsMetadata}
        onChange={this.onChangeForm}
        configData={this.state.configData}
        saveFn={this.saveNew}
        saveText="Create Bot"
        errorResp={this.state.errorResp}
        />);
    }
    
    if (this.props.location.pathname !== "/edit" && this.props.location.pathname !== "/details") {
      console.log("invalid path: " + this.props.location.pathname);
      return "";
    }

    if (this.props.location.search.length === 0) {
      console.log("no search params provided to '" + this.props.location.pathname + "' route");
      return "";
    }

    let searchParams = new URLSearchParams(this.props.location.search.substring(1));
    let botNameEncoded = searchParams.get("bot_name");
    if (!botNameEncoded) {
      console.log("no botName param provided to '" + this.props.location.pathname + "' route");
      return "";
    }

    let botName = decodeURIComponent(botNameEncoded);
    if (!this.state.configData) {
      this.loadBotConfigData(botName);
      return (<div>Fetching config file for bot: {botName}</div>);
    }

    const isDetails = this.props.location.pathname === "/details";

    if (isDetails && !this.metricsInterval) {
        this.startMetricsPolling(botName);
    }

    let formTitle = "Edit Bot";
    if (isDetails) {
      formTitle = "Bot Details";
    }

    const formComponent = (
        <Form
        router={this.props.history}
        isNew={false}
        baseUrl={this.props.baseUrl}
        title={formTitle}
        segmentNetworkOptions={segmentNetworkOptions}
        optionsMetadata={this.state.optionsMetadata}
        onChange={this.onChangeForm}
        configData={this.state.configData}
        saveFn={this.saveEdit}
        saveText="Save Bot Updates"
        errorResp={this.state.errorResp}
        readOnly={isDetails}
        />
    );

    if (isDetails) {
        return (
            <div className={grid.container}>
                <div style={{ display: 'flex' }}>
                    <div style={{ flexGrow: 1 }}>
                        {formComponent}
                    </div>
                    <div>
                        <SideBar
                            buyCount={this.state.botMetrics.trade_count_buy}
                            sellCount={this.state.botMetrics.trade_count_sell}
                            xlmPrice={this.state.xlmPrice}
                            xrpPrice={this.state.xrpPrice}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return formComponent;
  }
}

export default NewBot;
