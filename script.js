//document
let db;
let lsc;
//last selected cell

$("document").ready(function () {
    //a click event is attached with element with cell class]
    //this function show address on formula bar

    $(".cell").on("click", function () {
        let rowId = Number($(this).attr("rid"));
        //this mai hai voh element joh on click event se select kiya hai
        // yeh $(this).attr("rid") aapko value dega string mai usko number mai convert kara
        
        let colId = Number($(this).attr("cid"));

        let cellAddress = String.fromCharCode(65 + colId) + (rowId+1);
        // console.log("rowId", rowId);
        // console.log("colId", colId);
        // console.log(cellAddress);
        // console.log("cell is clicked");
        
        $("#address").val(cellAddress);
        //input ke liye .val use hota hai

        let cellObject =db[rowId][colId];
        $("#formula").val(cellObject.formula);
    });

    //jab bhi ek cell ko select karne ke baad usko deselect karke joh bhi value usme likhi thi usko db mai daalo
    $(".cell").on("blur", function(){
        lsc=this;
        console.log("blur event fired");
        let value= $(this).text();
        let rowId= Number($(this).attr("rid"));
        let colId=Number($(this).attr("cid"));
        //yeh saari values nikaal li cell ke object ke liye

        let cellObject=db[rowId][colId];
        if(cellObject.value!=value){
            cellObject.value=value;

            if(cellObject.formula){
                removeFormula(cellObject);
                $("#formula").val("");
                //ab toh kisi pe depend nhi kr raha na toh khali kr diya formulaBar
            }
            //yeh (3) case ke liye ki mai pehle parents pe dependent tha
            //but ab meri value badal di ab kisi pe depend nhi karta
            //but mere children mere pe depend kr rahe hai abhi bhi unko toh kr dunga 
            //agli line mai update

            updateChildren(cellObject);
            //jab meri value change hogi (1) case se toh mere children bhi change ho

            console.log(cellObject);
            console.log(db);
        }
    })

    function removeFormula(cellObject){
            
            //     name:"B1",
            //     value:"300",  30->300
            //     formula:"(A1 + A2 )",
            //     children:["C1"]
                    // parents:["A1" , "A2"]
            // }
        cellObject.formula="";
        //khud ka formula hataya

        for(let i=0;i<cellObject.parents.length;i++){
            let parentName=cellObject.parents[i];
            let {rowId , colId}=getRowIdAndColId(parentName);
            let parentCellObject =db[rowId][colId];
            //iss parents mai se khud ko hata do

            //eg. children:["B1","C1","D1"]
            let filterChildren=parentCellObject.children.filter( function(child){
                return child!=cellObject.name;
            })
            //filteredCHildren=["C1","D1"]
            //it is a callBack function that takes child as data and voh child return karega
            //joh current cellObject nhi hai

            parentCellObject.children=filterChildren;
        }
        //khud ke parents mai se khud ko hataya

        cellObject.parents=[];
        //khud ke parents hata diye
    }

    function updateChildren(cellObject){
        // {
        //     name:"A1",
        //     value:"20",  10->20
        //     formula:"",
        //     children:["B1"]
                // parents:[]
        // }
        //iske saare children update ho jao
        for(let i=0;i<cellObject.children.length;i++){
            
            let child=cellObject.children[i];
            //B1
            let {rowId,colId}=getRowIdAndColId(child);
            let childrenCellObject=db[rowId][colId];
            //A1 ka children nikaal liya
             // {
        //     name:"B1",
        //     value:"30",  
        //     formula:"(A1+A2)",
        //     children:["C1","D1"],
                // parents:["A1","A2"]
        // }
            let value=solveFormula(childrenCellObject.formula);
            //vohi formula hai but iska parent naya ho gaya hai ab toh nayi value le aayega
            //solve formula mai apna object nhi bheja toh undefined gaya
            //kyuki bhej dete na toh children aur parent update bhi call hota faltu
            
            //update db
            childrenCellObject.value=value+"";

            //update ui
            $(`.cell[rid="${rowId}"][cid="${colId}"]`).text(value);
            
            updateChildren(childrenCellObject);
            //this is recursive call ki yeh fir aagey apne children bhi update kr dega
            //jab children nhi hai tpoh loop nhi chalega and vaha se return
        }
    }



    //to get the value from the formula bar
    $("#formula").on("blur", function(){

        let formula=$(this).val();
        //this mai hai formula bar
        //.val use katte hai input ke liye and .text() apan ne 
        //use kiye tha value nikalne ke liye cell mai se since woh input tag nhi tha
        // console.log(formula);
        

        //db update
        let address=$("#address").val();
        //since address bar ek input tag hai toh val laga rahe hai
        //address of voh cell joh update karna hai
        let {rowId,colId}= getRowIdAndColId(address);
        let cellObject= db[rowId][colId];
        
        //Jis cell ko update karna chahte ho
        //uss cell ka object db se nikaal lo
        //check if cellObject formula must not be equal to the new formula
        if(cellObject.formula!=formula){

            removeFormula(cellObject);
            //yeh (4) case ke liye jab formula badal raha hai
            //sab kuch (3) vala kr dega uske baad solve formula bhi call ho raha hai
            //naye ke liye 

            let value=solveFormula(formula,cellObject);
            cellObject.value=value+"";
            cellObject.formula=formula;

            updateChildren(cellObject);
            //yeh (2) case ke liye ki kabhi mera formula change ho jaye toh mere
            //children bhi uss ke according update ho jaye

            //ui update
            $(lsc).text(value);
            //matlab joh cell ka div selected hai uspe value likh di
        }
    })

    function solveFormula(formula,cellObject){
        //formula="( A1 + A2 )"; with spaces hai
        console.log(cellObject)
        let fComponents=formula.split(" ");
        let flag=0;
        //["(", "A1", "+", "A2", ")"]
        // console.log(fComponents);
        for(let i=0;i<fComponents.length;i++){
            let fComp=fComponents[i];

            let cellName=fComp[0];
            //If A1 aaya => cellName="A"
            if(cellName>="A" && cellName<="Z"){
                //fComp = A1 => colID rowId
                let {rowId,colId}= getRowIdAndColId(fComp);
                
                let parentCellObject= db[rowId][colId];
                //A1 ke cellObject mai gaye

                // if(cellObject.children.includes(parentCellObject.name)){
                //     console.log("Cycle Detected");
                //     flag=1;
                //     return;
                // }
                
                if(cellObject){
                    //add self to children of parentCellObject
                    addSelfToParentschildren(cellObject,parentCellObject);

                    //update parents of self cellObject
                    updateParentsOfSelfCellObject(cellObject,fComp);
                }
                
                let value=parentCellObject.value;
                //value=10 hai A1 ki
                
                formula = formula.replace(fComp,value);
                //formula = "(10+A2)"
            }
        }
        //loop ke baad formula = "( 10 + 20 )"
        //stack infix laga sakte ho
        //yaa fir eval("expression") yeh use kr lo
        if(flag==0){
            let value=eval(formula);
            return value;
        }  
    }

    function addSelfToParentschildren(cellObject,parentCellObject){
        //B1 will add himself to childeren of A1 and A2
        parentCellObject.children.push(cellObject.name);
    }

    function updateParentsOfSelfCellObject(cellObject,fComp){
        //B1 will add A1 and A2 in is parents 
        cellObject.parents.push(fComp);
    }

    function getRowIdAndColId(address){
        console.log(address);
        //address can be "A1","B2","Z100"
        let colId=address.charCodeAt(0) -65;  //"B" isko banana hai=>1
        let rowId=Number(address.substring(1))-1;  //"2" isko banana hai=>1
        return {rowId: rowId,
                colId: colId};
    }


    //to create a database for all the cells
    //actual mai IIFE function hai aate se db ban jayega
    function init(){
        
        //db=[ [{},{},{},{},{}] , [{},{},{},{},{}] , [{},{},{},{},{}] ];
        //har row ka ek array ke andar har cell ka ek element
        //db=2600
        db=[];
        
        for(let i=0;i<100;i++){
            let row=[];
            for(let j=0; j<26; j++){
                //i? , j?
                let cellAddress=String.fromCharCode(65 + j) + (i+1);
                let cellObejct={
                    name:cellAddress,
                    value: "",
                    formula: "",
                    parents : [], //kis se uska formula associated hai
                    children : [] //kaunse cell ke formula mai mai hu
                }
                //1-parents and children chahiye ki kabhi parent ki value update ho toh
                //children ki bhi value update ho(children-> jis se uska formula associated hai)

                //cell object is pushed 26 times
                row.push(cellObejct);
            }
            //finally row is pushed in db
            db.push(row);
        }
        console.log(db);
    }
    init();

});

