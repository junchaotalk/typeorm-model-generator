/**
 * EntityInfo
 */
interface EntityInfo {
    EntityName:String;
    EntityNameCamel:String;
    EntityNameSnake:String;
    Columns:ColumnInfo[];
    Indexes:IndexInfo[];
}