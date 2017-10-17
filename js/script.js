let genres = [];

/*============================== Startup functions =======================================*/

function requestGenres(){
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/genre/movie/list?api_key=48f0555674730b7ab94aaeaf44dd3692&language=en-US',
            method: 'GET'
        }
    ).done(function(data){
        genres = data.genres;
    }).fail(function(){
        console.log("Something went wrong in requestGenres");
    });
}

function requestPopularMovies(){
    let d = new Date();
    d.setMonth(d.getMonth() - 6);
    let year = d.getFullYear();
    let month = d.getMonth()+1;
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/discover/movie?vote_average.gte=6.5&vote_count.gte=2000&primary_release_date.gte='+year+'-'+month+'-01&page=1&include_video=false&include_adult=false&sort_by=popularity.desc&language=en-US&api_key=48f0555674730b7ab94aaeaf44dd3692',
            method: 'GET'
        }
    ).done(function(data){
        showResults(data,1);
    }).fail(function(){
        console.log("Something went wrong in requestPopularMovies");
    });
}

function showResults(obj, currentPage=1){
    let pages = obj.total_pages;
    let results = obj.total_results;
    if(results > 20){
        generatePagination(results, currentPage);
    }
    generateHTML(obj.results);
}

function generatePagination(results, currentPage){
    let pagination = $("#pagination");
    let lastButton = pagination.find("button:last-child");
    let totalPageNumber = Math.ceil(results/20);
    pagination.css("display", "flex");
    let i = currentPage;
    let cond = true;
    while(i <= totalPageNumber && cond){
        let button = '';
        if(i === currentPage){
            button = $('<button class="page page_selected">'+i+'</button>');
        } else {
            button = $('<button class="page">'+i+'</button>');
        }
        button.insertBefore(lastButton);
        if(i === currentPage+2 && totalPageNumber > currentPage+3){
            button = $('<button class="page">...</button>');
            button.insertBefore(lastButton);
            cond = false;
            button = $('<button>' + totalPageNumber + '</button>');
            button.insertBefore(lastButton);
        }
        i++;
    }
}

function generateHTML(arr){
    for(let i=0; i<arr.length; i++){
        let result = $('<div class="result panel"></div>');
        let src = '';
        if(arr[i].poster_path == null){
            src = 'images/no_image.png';
        } else {
            src = 'https://image.tmdb.org/t/p/w92' + arr[i].poster_path;
        }
        result.append('<img src="'  + src + '" class="image"/>');
        result.append('<h4 class="title">' + arr[i].title + '</h4>');
        result.append('<p class="release_date"><i class="fa fa-calendar" aria-hidden="true"></i>' + arr[i].release_date + '</p>');
        let content = getGenres(arr[i].genre_ids);
        result.append('<p class="genre_ids">' + content + '</p>');
        content = arr[i].overview;
        content = content.length > 100 ? content.slice(0,97) + '...' : content ;
        result.append('<p class="overview">' + content + '<span>Click for more</span></p>');
        result.append('<p class="original_language">' + arr[i].original_language + '</p>');
        result.append('<p class="vote_average">' + arr[i].vote_average + '<i class="fa fa-star" aria-hidden="true"></i></p>');
        $("#results_container").append(result);
    }
}

/*============================== Listener functions =======================================*/

function showAdvancedSearch(){
    $(".search").css("display", "flex");
}

function hideAdvancedSearch(){
    $(".search").css("display", "none");
    $(".search:nth-child(-n+2)").css("display", "flex");
}

function startSearch(){
    $('.result').remove();
    let criterias = checkSearchCriterias();
    if(criterias){
        searchBy(criterias);
    } else {
        console.log("Please enter something to search");
    }
}

/*============================== Search functions =======================================*/

function checkSearchCriterias(){
    let result = {};
    result.title = '';
    result.urlParameters = '';
    result.otherCriterias = {};
    let criteria = checkTitle();
    if(criteria){
        result.title = criteria;
    }
    criteria = checkDategte();
    if(criteria){
        result.urlParameters += '&primary_release_date.gte=' + criteria;
        result.otherCriterias.dategte = criteria;
    }
    criteria = checkDatelte();
    if(criteria){
        result.urlParameters += '&primary_release_date.lte=' + criteria;
        result.otherCriterias.datelte = criteria;
    }
/*
    let ready = true;
    criteria = checkActors();
    if(criteria){
        console.log('byActors!');
        ready = false;
    }
*/
    console.log(result, typeof result);
    return $.isEmptyObject(result) ? false : result;
}

function checkTitle(){
    let title = $('#title');
    if (title && title.val()) {
        //TODO validation
        return title.val();
    } else {
        return false;
    }
}

function checkDategte(){
    let date = $('#date_gte');
    if (date && date.val()) {
        return date.val();
    } else {
        return false;
    }
}

function checkDatelte(){
    let date = $('#date_lte');
    if (date && date.val()) {
        return date.val();
    } else {
        return false;
    }
}

//function checkActors(){
//    let actors = $('#actors');
//    if (actors && actors.val()) {
//        requestActorId(actors.val());
//        return true;
//    } else {
//        return false;
//    }
//}

//function requestActorId(actors){
//    //TODO work with more actors
//    $.ajax(
//        {
//            url: 'https://api.themoviedb.org/3/search/person?query='+encodeURIComponent(actors)+'&api_key=48f0555674730b7ab94aaeaf44dd3692',
//            method: 'GET'
//        }
//    ).done(function(data){
//        //console.log(data.results[0].id);
//        actorId = data.results[0].id;
//    }).fail(function(){
//        console.log("Something went wrong in requestActorId");
//    });
//}

function searchBy(obj){
/*
    $.each(obj, function(property, value){
        property = property.substr(0,1).toUpperCase()+property.substr(1);
        let functionName = "searchBy" + property;
        eval(functionName + "('" + value + "')");
    });
*/
    if(obj.title){
        searchByTitle(obj.title, obj.otherCriterias)
    } else {
        console.log('Search by url');
    }
}

//noinspection JSUnusedLocalSymbols
//requestByTitle
function searchByTitle(str, otherCriterias){
    console.log('Other citerias: ', otherCriterias);
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/search/movie?api_key=48f0555674730b7ab94aaeaf44dd3692&query='+encodeURIComponent(str),
            method: 'GET'
        }
    ).done(function(data){
        console.log(data);
        showResults(data);
    });
}

//noinspection JSUnusedLocalSymbols
function searchByYear(str){
    console.log("by year " + str);
}

function getGenres(ids){
    let result = '';
    $.each(ids,function(i, id){
        for(let j=0; j<genres.length; j++){
            if(genres[j].id === id){
                result += genres[j].name + ',';
                break;
            }
        }
    });
    result = result.slice(0, -1);
    return result;
}

/*============================== Event listeners =======================================*/

$("#advanced_search").change(
    function(){
        if (this.checked) {
            showAdvancedSearch();
        } else {
            hideAdvancedSearch();
        }
    });
$(".search_button").click(startSearch);

requestGenres();
requestPopularMovies();
