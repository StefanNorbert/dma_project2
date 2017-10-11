function startSearch(){
    let criterias = checkSearchCriterias();
    if(criterias){
        searchBy(criterias);
    } else {
        console.log("Please enter something to search");
    }
}

function checkSearchCriterias(){
    let result = {};
    let title = checkTitle();
    if(title){
        result.title = title;
    }
    return $.isEmptyObject(result) ? false : result;
}

function checkTitle(){
    if ($('#title') && $('#title').val()) {
        return $('#title').val();
    } else {
        return false;
    }
}

function searchBy(object){
    $.each(object, function(property, value){
        property = property.substr(0,1).toUpperCase()+property.substr(1);
        let functionName = "searchBy" + property;
        eval(functionName + "('" + value + "')");
    });
}

function searchByTitle(string){
    console.log("by title " + string);
}

function searchByYear(string){
    console.log("by year " + string);
}

$(".search").click(startSearch);
