// Auto-generated , DO NOT EDIT
import {Entity} from "@subql/types";
import assert from 'assert';


export class Incentive implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public blockNum: number;

    public bsxMultiplier: number;

    public hdxBonus: number;

    public significant: boolean;

    public siblingParachainId?: string;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Incentive entity without an ID");
        await store.set('Incentive', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Incentive entity without an ID");
        await store.remove('Incentive', id.toString());
    }

    static async get(id:string): Promise<Incentive | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Incentive entity without an ID");
        const record = await store.get('Incentive', id.toString());
        if (record){
            return Incentive.create(record);
        }else{
            return;
        }
    }


    static async getByBlockNum(blockNum: number): Promise<Incentive[] | undefined>{
      
      const records = await store.getByField('Incentive', 'blockNum', blockNum);
      return records.map(record => Incentive.create(record));
      
    }

    static async getBySignificant(significant: boolean): Promise<Incentive[] | undefined>{
      
      const records = await store.getByField('Incentive', 'significant', significant);
      return records.map(record => Incentive.create(record));
      
    }

    static async getBySiblingParachainId(siblingParachainId: string): Promise<Incentive[] | undefined>{
      
      const records = await store.getByField('Incentive', 'siblingParachainId', siblingParachainId);
      return records.map(record => Incentive.create(record));
      
    }


    static create(record){
        let entity = new Incentive(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
