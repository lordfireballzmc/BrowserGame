/** Canonical numeric rules for the Bastionfall prototype, per design bible v0.1. */
export const BALANCE_VERSION = 1;

export const ENEMY_KINDS = [
  "scrapper", "runner", "shieldbearer", "sapper", "banner", "behemoth",
] as const;
export type EnemyKind = (typeof ENEMY_KINDS)[number];

export const TOWER_KINDS = [
  "boltSpire", "arrowRack", "lobber", "signalWard",
] as const;
export type TowerKind = (typeof TOWER_KINDS)[number];

export interface EnemyBalance {
  readonly health: number;
  readonly speedMetersPerSecond: number;
  readonly contactDamagePerSecond: number;
  readonly crownDropMin: number;
  readonly crownDropMax: number;
}

export interface TowerBalance {
  readonly costCrowns: number;
  readonly rangeMeters: number;
  readonly attackIntervalSeconds: number | null;
  readonly damagePerProjectile: number;
  readonly projectilesPerAttack: number;
}

export interface BalanceConfig {
  readonly hero: {
    readonly health: number;
    readonly speedMetersPerSecond: number;
    readonly accelerationMetersPerSecondSquared: number;
    readonly decelerationMetersPerSecondSquared: number;
    readonly radiusMeters: number;
    readonly autoAttackRangeMeters: number;
    readonly autoAttackIntervalSeconds: number;
    readonly autoAttackDamage: number;
    readonly projectileSpeedMetersPerSecond: number;
    readonly dashDistanceMeters: number;
    readonly dashCooldownSeconds: number;
  };
  readonly core: { readonly health: number };
  readonly economy: {
    readonly startingCrowns: number;
    readonly betweenWaveCrowns: number;
    readonly tier2UpgradeCostRatio: number;
    readonly tier3UpgradeCostRatio: number;
    readonly saleReturnRatio: number;
  };
  readonly enemies: Record<EnemyKind, EnemyBalance>;
  readonly towers: Record<TowerKind, TowerBalance>;
}

export const BALANCE = {
  hero: {
    health: 100,
    speedMetersPerSecond: 4.2,
    accelerationMetersPerSecondSquared: 16,
    decelerationMetersPerSecondSquared: 23,
    radiusMeters: 0.55,
    autoAttackRangeMeters: 7,
    autoAttackIntervalSeconds: 0.55,
    autoAttackDamage: 8,
    projectileSpeedMetersPerSecond: 15,
    dashDistanceMeters: 2.6,
    dashCooldownSeconds: 6,
  },
  core: { health: 300 },
  economy: {
    startingCrowns: 25,
    betweenWaveCrowns: 10,
    tier2UpgradeCostRatio: 0.7,
    tier3UpgradeCostRatio: 1.3,
    saleReturnRatio: 0.45,
  },
  enemies: {
    scrapper: { health: 30, speedMetersPerSecond: 1.8, contactDamagePerSecond: 7, crownDropMin: 2, crownDropMax: 3 },
    runner: { health: 18, speedMetersPerSecond: 3.4, contactDamagePerSecond: 5, crownDropMin: 2, crownDropMax: 2 },
    shieldbearer: { health: 72, speedMetersPerSecond: 1.25, contactDamagePerSecond: 9, crownDropMin: 5, crownDropMax: 5 },
    sapper: { health: 48, speedMetersPerSecond: 1.65, contactDamagePerSecond: 12, crownDropMin: 6, crownDropMax: 6 },
    banner: { health: 50, speedMetersPerSecond: 1.55, contactDamagePerSecond: 5, crownDropMin: 7, crownDropMax: 7 },
    behemoth: { health: 620, speedMetersPerSecond: 0.75, contactDamagePerSecond: 20, crownDropMin: 45, crownDropMax: 45 },
  },
  towers: {
    boltSpire: { costCrowns: 20, rangeMeters: 9.5, attackIntervalSeconds: 0.9, damagePerProjectile: 13, projectilesPerAttack: 1 },
    arrowRack: { costCrowns: 35, rangeMeters: 7.5, attackIntervalSeconds: 1.8, damagePerProjectile: 7, projectilesPerAttack: 3 },
    lobber: { costCrowns: 50, rangeMeters: 10, attackIntervalSeconds: 2.8, damagePerProjectile: 31, projectilesPerAttack: 1 },
    signalWard: { costCrowns: 45, rangeMeters: 6, attackIntervalSeconds: null, damagePerProjectile: 0, projectilesPerAttack: 0 },
  },
} as const satisfies BalanceConfig;

/** Pure economy function: never spends currency or mutates a world. */
export function upgradeCostCrowns(kind: TowerKind, nextTier: 2 | 3): number {
  const baseCost = BALANCE.towers[kind].costCrowns;
  return Math.ceil(baseCost * (
    nextTier === 2
      ? BALANCE.economy.tier2UpgradeCostRatio
      : BALANCE.economy.tier3UpgradeCostRatio
  ));
}
