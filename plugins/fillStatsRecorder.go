package plugins

import (
	"fmt"
	"sync"

	"github.com/stellar/kelp/api"
	"github.com/stellar/kelp/model"
)

// FillStatsRecorder tracks statistics about fills
type FillStatsRecorder struct {
	lock           *sync.Mutex
	tradeCountBuy  int64
	tradeCountSell int64
}

// ensure FillStatsRecorder implements api.FillHandler
var _ api.FillHandler = &FillStatsRecorder{}

// MakeFillStatsRecorder is a factory method
func MakeFillStatsRecorder() *FillStatsRecorder {
	return &FillStatsRecorder{
		lock:           &sync.Mutex{},
		tradeCountBuy:  0,
		tradeCountSell: 0,
	}
}

// HandleFill impl
func (f *FillStatsRecorder) HandleFill(trade model.Trade) error {
	f.lock.Lock()
	defer f.lock.Unlock()

	if trade.OrderAction.IsBuy() {
		f.tradeCountBuy++
	} else if trade.OrderAction.IsSell() {
		f.tradeCountSell++
	}
	return nil
}

// GetStats returns the current stats
func (f *FillStatsRecorder) GetStats() map[string]interface{} {
	f.lock.Lock()
	defer f.lock.Unlock()

	return map[string]interface{}{
		"trade_count_buy":  f.tradeCountBuy,
		"trade_count_sell": f.tradeCountSell,
	}
}

// String impl
func (f *FillStatsRecorder) String() string {
	f.lock.Lock()
	defer f.lock.Unlock()
	return fmt.Sprintf("FillStatsRecorder[buy=%d, sell=%d]", f.tradeCountBuy, f.tradeCountSell)
}
