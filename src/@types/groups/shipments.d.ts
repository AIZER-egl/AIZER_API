import type { Items } from './items';

interface ShipmentQuantities {
    item: string;
    quantity: number;
}

interface Shipments {
    uuid: string;
    items: ShipmentQuantities[];
    delieveryFee: number;
    delieveryStatus: 'pending' | 'shipped' | 'delievered' | 'cancelled' | 'returned';
    delieveryReference?: string;
    store: string;
}

interface FullShipmentQuantities {
    item: Items[];
    quantity: number;
}
interface FullShipments {
    uuid: string;
    items: FullShipmentQuantities[];
    delieveryFee: number;
    delieveryStatus: 'pending' | 'shipped' | 'delievered' | 'cancelled' | 'returned';
    delieveryReference?: string;
    store: string;
}

export { Shipments, FullShipmentQuantities, FullShipments, ShipmentQuantities };
