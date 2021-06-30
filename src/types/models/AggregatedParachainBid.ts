// Auto-generated , DO NOT EDIT
import {Entity} from "@subql/types";
import assert from 'assert';


export class AggregatedParachainBid implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public parachainId: string;

    public fundId?: string;

    public amount: bigint;

    public blockNum: number;

    public createdAt: Date;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save AggregatedParachainBid entity without an ID");
        await store.set('AggregatedParachainBid', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove AggregatedParachainBid entity without an ID");
        await store.remove('AggregatedParachainBid', id.toString());
    }

    static async get(id:string): Promise<AggregatedParachainBid | undefined>{
        assert((id !== null && id !== undefined), "Cannot get AggregatedParachainBid entity without an ID");
        const record = await store.get('AggregatedParachainBid', id.toString());
        if (record){
            return AggregatedParachainBid.create(record);
        }else{
            return;
        }
    }


    static async getByParachainId(parachainId: string): Promise<AggregatedParachainBid[] | undefined>{
      
      const records = await store.getByField('AggregatedParachainBid', 'parachainId', parachainId);
      return records.map(record => AggregatedParachainBid.create(record));
      
    }

    static async getByFundId(fundId: string): Promise<AggregatedParachainBid[] | undefined>{
      
      const records = await store.getByField('AggregatedParachainBid', 'fundId', fundId);
      return records.map(record => AggregatedParachainBid.create(record));
      
    }


    static create(record){
        let entity = new AggregatedParachainBid(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
