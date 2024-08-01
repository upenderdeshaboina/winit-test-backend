const express=require('express')
const {open}=require('sqlite');
const sqlite3=require('sqlite3')
const cors=require('cors')
const path=require('path')
const bodyParser=require('body-parser')
const app=express()
app.use(cors())
app.use(bodyParser.json())
const dbPath=path.join(__dirname,'salesorder.db')
let db=null;
const initializeDBandServer=async()=>{
    try {
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        app.listen(3005,()=>{
            console.log(`server running on http://localhost:3005/`)
        })
        await db.run(`
                create table if not exists customers (
                    id integer primary key autoincrement,
                    sales_number text varchar(50),
                    customer_code text varchar(50),
                    customer_name text varchar(250),
                    order_date datetime default real,
                    total_amount integer decimal(18,3)
                )
            `)
        await db.run(`
                create table if not exists orders(
                    id integer primary key autoincrement,
                    sales_order_id integer ,
                    item_code integer varchar(50),
                    item_name text varchar(250),
                    unit_price integer decimal(18,2),
                    quantity integer decimal(18,2),
                    total_price integer decimal(18,2)
                )
            `)
    }catch(error){
        console.log(`Error Db: ${error.message}`)
        process.exit(1)
    }
}
initializeDBandServer()
app.get('/',async(req,res)=>{
    res.send('working')
})
app.post('/customers',async(req,res)=>{
    const {salesOrderNumber, customerName,customerCode,orderDate, totalAmount}=req.body
    try {
        const addCustomerQuery=`
            insert into customers
            values (?,?,?,?)
        `
        const result=await db.run(addCustomerQuery,[salesOrderNumber,customerCode,customerName,totalAmount])
        console.log(result.lastID)
    } catch (error) {
        console.log(`Error adding customer ${error.message}`)
        res.status(404)
        res.send('Error adding customer')
    }
})
app.get('/customers',async(req,res)=>{
    const getQuery=`select * from customers`
    try {
        const result=await db.all(getQuery)
        console.log(result)
        res.status(200)
        res.send(result)
    } catch (error) {
        console.log(error.message)
    }
})
app.put('/customers/:id',async(req,res)=>{
    const {id}=req.params
    const {salesOrderNumber,customerName,customerCode,totalAmount}=req.body
    const query=`
        update customers
        set (
            sales_number=?,
            customer_code=?,
            customer_name=?,
            total_amount=?
        )
        where id=?
    `
    try {
        const result=await db.run(query,[salesOrderNumber,customerCode,customerName,totalAmount,id])
        console.log(result)
        res.status(200)
        res.send(`data updated of ${id}`)
    } catch (error) {
        console.log(`error updating user-id:${id}: ${error.message}`)
    }
})
app.delete('/customers/:id',async(req,res)=>{
    const {id}=req.params
    try {
        const query=`
            delete from customers
            where id=?
        `
        const result=await db.run(query,[id])
    } catch (error) {
        console.log('Error deleting customer')
    }
})
app.post('/orders',async(req,res)=>{
    const {salesOrderId,itemCode,itemName,unitPrice,quantity,totalPrice}=req.body
    try {
        const insertQuery=`
            insert into orders
            values(id,?,?,?,?,?)
        `
        await db.run(insertQuery,[salesOrderId,itemCode,itemName,unitPrice,quantity,totalPrice])
        res.status(200)
        res.send('item added successfully')
    } catch (error) {
        console.log(`Error adding item: ${error.message}`)
        res.status(400)
        res.send('error adding item')
    }
})

app.get('/orders',async(req,res)=>{
    try {
        const query=`select * from orders`
        const result=await db.all(query)
        res.status(200)
        res.send(result)
    } catch (error) {
        console.log(`error retrieving data: ${error.message}`)
        res.status(400)
        res.send('error retrieving data')
    }
})
app.delete('/order/:id',async(req,res)=>{
    const {id}=req.params
    const getQuery=`select * from orders where id=?`
    const result=await db.get(getQuery,[id])
    if (!result){
        try {
            const query=`delete from orders where id=?`
            const result=await db.run(query,[id])
            if (result.changes>0){
                res.status(200)
                res.send('item deleted successfully')
            }
        } catch (error) {
            console.log(`error deleting item : ${error.message}`)
        }
    }else{
        res.status(400)
        res.send('item not available')
    }
    
})
module.exports=app