import { AbstractDriver } from './abstractDriver'
import * as Bluebird from 'bluebird'
import * as Mysql from 'mysql'
import * as _ from 'lodash';
/**
 * MssqlDriver
 */
export class MysqlDriver extends AbstractDriver {
    FindPrimaryColumnsFromIndexes(dbModel: DatabaseModel) {
        dbModel.entities.forEach(entity => {
            let primaryIndex = entity.Indexes.find(v=>v.isPrimaryKey);
            if (!primaryIndex){
                console.error(`Table ${entity.EntityName} has no PK.`)
                return;
            }
            let pIndex=primaryIndex; //typescript error? pIndex:IndexInfo; primaryIndex:IndexInfo|undefined
            entity.Columns.forEach(col=>{
                if(pIndex.columns.some( cIndex=> cIndex.name==col.name)) {
                    col.isPrimary = true;
                    col.isSpecialColumn = true;
                }
                if (col.name == 'create_time') {
                    col.isCreateTime = true;
                    col.isSpecialColumn = true;
                } else if (col.name == 'update_time') {
                    col.isUpdateTime = true;
                    col.isSpecialColumn = true;
                } else if (col.name == 'version') {
                    col.isVersion = true;
                    col.isSpecialColumn = true;
                }
            })
        });
    }

    GetCamelCase(entityName: string) {
        entityName = _.camelCase(entityName).replace(/tbl/g,'');
        return entityName.substring(0,1).toUpperCase() + entityName.substring(1);
    }

    GetSnakeName(entityName: string) {
        entityName = entityName.replace(/tbl_/g,'');
        return entityName;
    }

    async GetAllTables(): Promise<EntityInfo[]> {
        let request = this.Connection;
        let response: { TABLE_SCHEMA: string, TABLE_NAME: string }[]
            = await request.queryAsync(`SELECT TABLE_SCHEMA,TABLE_NAME FROM information_schema.tables where TABLE_SCHEMA='${this.Config.database}'`);
        let ret: EntityInfo[] = <EntityInfo[]>[];
        response.forEach((val) => {
            let ent: EntityInfo = <EntityInfo>{};
            ent.EntityNameCamel = this.GetCamelCase(val.TABLE_NAME);
            ent.EntityNameSnake = this.GetSnakeName(val.TABLE_NAME);
            ent.EntityName = val.TABLE_NAME;
            ent.Columns = <ColumnInfo[]>[];
            ent.Indexes = <IndexInfo[]>[];
            ret.push(ent);
        })
        return ret;
    }
    async GetCoulmnsFromEntity(entities: EntityInfo[]) {
        let request = this.Connection;
        let response: { TABLE_NAME: string, COLUMN_NAME: string, COLUMN_DEFAULT: string,
             IS_NULLABLE: string, DATA_TYPE: string, CHARACTER_MAXIMUM_LENGTH: number,
            NUMERIC_PRECISION:number,NUMERIC_SCALE:number }[]
            = await request.queryAsync(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
   DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE 
   FROM information_schema.columns where TABLE_SCHEMA='${this.Config.database}'`);
        entities.forEach((ent) => {
            response.filter((filterVal) => {
                return filterVal.TABLE_NAME == ent.EntityName;
            }).forEach((resp) => {
                let colInfo: ColumnInfo = <ColumnInfo>{};
                colInfo.name = resp.COLUMN_NAME;
                colInfo.is_nullable = resp.IS_NULLABLE == 'YES' ? true : false;
                colInfo.default = resp.COLUMN_DEFAULT;
                colInfo.isSpecialColumn = false; 
                switch (resp.DATA_TYPE) {
                    case "int":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "int"
                        break;
                    case "tinyint":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "smallint"
                        break;
                    case "smallint":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "smallint"
                        break;
                    case "bit":
                        colInfo.ts_type = "boolean"
                        colInfo.sql_type = "boolean"
                        break;
                    case "float":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "float"
                        break;
                    case "double":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "double"
                        break;
                    case "date":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "date"
                        break;
                    case "datetime":
                        colInfo.ts_type = "Date";
                        colInfo.sql_type = "datetime"
                        break;
                    case "char":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "string"
                        break;
                    case "nchar":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    case "text":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    case "longtext":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    case "ntext":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    case "varchar":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "string"
                        break;
                    case "nvarchar":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "string"
                        break;
                    case "money":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "decimal"
                        break;
                    case "real":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "double"
                        break;
                    case "decimal":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "decimal"
                        colInfo.numericPrecision=resp.NUMERIC_PRECISION
                        colInfo.numericScale=resp.NUMERIC_SCALE
                        break;
                    // case "xml":
                    //     colInfo.ts_type = "number"
                    //     break;
                    default:
                        console.error("Unknown column type:" + resp.DATA_TYPE);
                        break;
                }
                colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH>0?resp.CHARACTER_MAXIMUM_LENGTH:null;
                if (colInfo.sql_type) ent.Columns.push(colInfo);
            })
        })
        return entities;
    }
    async GetIndexesFromEntity(entities: EntityInfo[]) {
        let request = this.Connection;
        let response: {
            TableName: string, IndexName: string, ColumnName: string, is_unique: number,
            is_primary_key: number, is_descending_key: number, is_included_column: number
        }[]
            = await request.queryAsync(`SELECT TABLE_NAME as TableName, INDEX_NAME as IndexName, COLUMN_NAME as ColumnName, NON_UNIQUE as is_unique FROM information_schema.statistics ;`);
            // console.log(entities[1]);
            // console.log(response[1]);
        entities.forEach((ent) => {
            response.filter((filterVal) => {
                 return filterVal.TableName == ent.EntityName;
            }).forEach((resp) => {
                let indexInfo: IndexInfo = <IndexInfo>{};
                let indexColumnInfo: IndexColumnInfo = <IndexColumnInfo>{};
                if (ent.Indexes.filter((filterVal) => {
                    return filterVal.name == resp.IndexName
                }).length > 0) {
                    indexInfo = ent.Indexes.filter((filterVal) => {
                        return filterVal.name == resp.IndexName
                    })[0];
                } else {
                    indexInfo.columns = <IndexColumnInfo[]>[];
                    indexInfo.name = resp.IndexName;
                    indexInfo.isUnique = resp.is_unique == 1 ? true : false;
                    if (indexInfo.name == 'PRIMARY') {
                        indexInfo.isPrimaryKey = true;
                    } else {
                        indexInfo.isPrimaryKey = false;
                    }
                    ent.Indexes.push(indexInfo);
                }
                indexColumnInfo.name = resp.ColumnName;
                indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
                indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
                indexInfo.columns.push(indexColumnInfo);

            })
        })
        return entities;
    }
    async GetRelations(): Promise<RelationInfo[]> {
        let request = this.Connection;
        let response: {
            TableWithForeignKey: string, FK_PartNo: number, ForeignKeyColumn: string,
            TableReferenced: string, ForeignKeyColumnReferenced: string,
            onDelete: "RESTRICT" | "CASCADE" | "SET NULL", object_id: number
        }[]
            = await request.queryAsync(`SELECT 
  TABLE_NAME as TableWithForeignKey, 
    COLUMN_NAME as ForeignKeyColumn  ,
    REFERENCED_TABLE_NAME as TableReferenced,
    REFERENCED_COLUMN_NAME as ForeignKeyColumnReferenced
FROM
  INFORMATION_SCHEMA.KEY_COLUMN_USAGE  where REFERENCED_COLUMN_NAME is not NULL`);
        let relations: RelationInfo[] = <RelationInfo[]>[];
        response.forEach((resp) => {
            let rels = relations.find((val) => {
                console.log(1);
                console.log(val);
                return val.object_id == resp.object_id;
            })
            if (rels == undefined) {
                rels = <RelationInfo>{};
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                rels.actionOnDelete = resp.onDelete;
                rels.object_id = resp.object_id;
                rels.ownerTable = resp.TableWithForeignKey;
                rels.referencedTableName = resp.TableReferenced;
                relations.push(rels);
            }
            rels.ownerColumnsNames.push(resp.ForeignKeyColumn);
            rels.referencedColumnsNames.push(resp.ForeignKeyColumnReferenced);
        })
        return relations;
    }
    async DisconnectFromServer() {
        if (this.Connection)
            await this.Connection.endAsync();
    }

    private Connection: Mysql.Connection;
    private Config: Mysql.config;
    async ConnectToServer(database: string, server: string, port: number, user: string, password: string) {
        let config: Mysql.config = {
            host: server,
            database: database,
            port: port,
            user: user,
            password: password,
        }
        this.Config = config;
        this.Connection = Bluebird.promisifyAll(Mysql.createConnection(config));
    }
}