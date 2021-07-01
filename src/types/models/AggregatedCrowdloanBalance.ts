// Auto-generated , DO NOT EDIT
import {Entity} from "@subql/types";
import assert from 'assert';


export class AggregatedCrowdloanBalance implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public parachainId: string;

    public fundId: string;

    public raised: bigint;

    public blockNum: number;

    public createdAt: Date;

    public isSignificant?: boolean;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save AggregatedCrowdloanBalance entity without an ID");
        await store.set('AggregatedCrowdloanBalance', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove AggregatedCrowdloanBalance entity without an ID");
        await store.remove('AggregatedCrowdloanBalance', id.toString());
    }

    static async get(id:string): Promise<AggregatedCrowdloanBalance | undefined>{
        assert((id !== null && id !== undefined), "Cannot get AggregatedCrowdloanBalance entity without an ID");
        const record = await store.get('AggregatedCrowdloanBalance', id.toString());
        if (record){
            return AggregatedCrowdloanBalance.create(record);
        }else{
            return;
        }
    }


    static async getByFundId(fundId: string): Promise<AggregatedCrowdloanBalance[] | undefined>{
      
      const records = await store.getByField('AggregatedCrowdloanBalance', 'fundId', fundId);
      return records.map(record => AggregatedCrowdloanBalance.create(record));
      
    }


    static create(record){
        let entity = new AggregatedCrowdloanBalance(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
