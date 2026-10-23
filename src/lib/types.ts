import type { MoneyType } from './moneyType'

export interface User { id: string; name: string }
export interface Finance { id: string; user_id: string; type: 'deposito' | 'inversion' | 'retiro' | 'gasto' | 'ingreso'; money_type: MoneyType; amount: number; note: string; created_at: string }
export interface Drug { id: string; emoji: string; name: string; stock: number; sold: number; craft_cost: number; sell_price: number }
export interface DrugSale { id: string; money_type: MoneyType; kind: 'ingreso' | 'venta'; user_id: string; drug_id: string; qty: number; unit_price: number; created_at: string }
export interface DrugMaterial { id: string; name: string; kind: 'semilla' | 'hoja'; stock: number }
export interface DrugMaterialMove { id: string; user_id: string; material_id: string; kind: 'ingreso' | 'consumo'; qty: number; note: string; created_at: string }
export interface House { id: string; user_id: string | null; qty: number; loot: number; note: string; created_at: string }
export interface WeaponPart { id: string; name: string; stock: number; note: string; created_at: string }
export interface WeaponPartMove { id: string; user_id: string; part_id: string; kind: 'ingreso' | 'retiro'; qty: number; note: string; created_at: string }
export interface ToolItem { id: string; name: string; stock: number; note: string; created_at: string }
export interface ToolMove { id: string; user_id: string; item_id: string; kind: 'ingreso' | 'retiro' | 'compra'; qty: number; unit_price: number; money_type: MoneyType; note: string; created_at: string }
export interface Weapon { id: string; emoji: string; name: string; stock: number; value: number; note: string; created_at: string }
export interface WeaponMove { id: string; user_id: string; weapon_id: string; money_type: MoneyType; kind: 'ingreso' | 'retiro' | 'compra' | 'venta'; qty: number; unit_price: number; note: string; created_at: string }
export interface Heist { id: string; user_id: string | null; loot_type: MoneyType | 'materiales'; loot_item: string; name: string; loot: number; participants: string; weapons_used: string; note: string; created_at: string }
export interface Fine { id: string; user_id: string; kind: 'multa' | 'paga'; amount: number; reason: string; paid: boolean; created_at: string }
export interface InvItem { id: string; user_id: string; item: string; qty: number }
export interface Material { id: string; user_id: string; kind: 'ingreso' | 'retiro'; material: 'chatarra' | 'plastico' | 'polvora'; qty: number; note: string; created_at: string }
export interface LogRow { id: string; user_id: string | null; user_name: string | null; action: string; entity: string; detail: Record<string, unknown>; created_at: string }
