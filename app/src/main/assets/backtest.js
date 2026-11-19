// A股智能选股器 V1.5
// 独立历史回测引擎
// 初始版本：资金与交易规则

const BACKTEST_CONFIG = {
  initialCapital: 500000,

  periods: {
    "1年": 365,
    "2年": 730,
    "3年": 1095
  },

  defaultPeriod: "3年",

  maxDrawdownLimit: 0.25,

  commissionRate: 0.0003,

  stampDutyRate: 0.0005,

  slippageRate: 0.001,

  minimumCommission: 5,

  lotSize: 100,

  tPlusOne: true,

  excludeST: true,

  excludeSuspended: true
};

// 计算买入费用
function calculateBuyFee(amount) {
  const commission = Math.max(
    amount * BACKTEST_CONFIG.commissionRate,
    BACKTEST_CONFIG.minimumCommission
  );

  const slippage = amount * BACKTEST_CONFIG.slippageRate;

  return commission + slippage;
}

// 计算卖出费用
function calculateSellFee(amount) {
  const commission = Math.max(
    amount * BACKTEST_CONFIG.commissionRate,
    BACKTEST_CONFIG.minimumCommission
  );

  const stampDuty =
    amount * BACKTEST_CONFIG.stampDutyRate;

  const slippage =
    amount * BACKTEST_CONFIG.slippageRate;

  return commission + stampDuty + slippage;
}

// 计算最大回撤
function calculateMaxDrawdown(equityCurve) {
  if (!Array.isArray(equityCurve) ||
      equityCurve.length === 0) {
    return 0;
  }

  let peak = equityCurve[0];
  let maxDrawdown = 0;

  for (const value of equityCurve) {
    if (!Number.isFinite(value) || value < 0) {
      continue;
    }

    peak = Math.max(peak, value);

    if (peak > 0) {
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  return maxDrawdown;
}
