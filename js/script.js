let genres = [];

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
        showResults(data);
    }).fail(function(){
        console.log("Something went wrong in requestPopularMovies");
    });
}

function showAdvancedSearch(){
    $(".search").css("display", "flex");
}

function hideAdvancedSearch(){
    $(".search").css("display", "none");
    $(".search:nth-child(-n+2)").css("display", "flex");
}

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
    let title = $('#title');
    if (title && title.val()) {
        return title.val();
    } else {
        return false;
    }
}

function searchBy(obj){
    $.each(obj, function(property, value){
        property = property.substr(0,1).toUpperCase()+property.substr(1);
        let functionName = "searchBy" + property;
        eval(functionName + "('" + value + "')");
        //let result = eval(functionName + "('" + value + "')");
        //console.log(result);
    });
}

//noinspection JSUnusedLocalSymbols
function searchByTitle(str){
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

function showResults(obj){
    let currentPage = 1;
    let pages = obj.total_pages;
    let results = obj.total_results;
    if(results > 10){
        generatePagination(results);
    }
    console.log(obj);
    //TODO make a copy of the array!!!!!! Not refference
    let arr = obj.results;
    arr[0].vote_count=1;
    console.log(arr);
    return;
    generateHTML(obj);
}

function generatePagination(int){
    let pagination = $("#pagination");
    let pageNumber = Math.ceil(int/10);
    pagination.css("display", "flex");
    let i = 2;
    let cond = true;
    let lastButton = pagination.find("button:last-child");
    while(i <= pageNumber && cond){
        let button = $('<button>'+i+'</button>');
        button.insertBefore(lastButton);
        if(i === 3 && pageNumber > 4){
            button = $('<button>...</button>');
            button.insertBefore(lastButton);
            cond = false;
            button = $('<button>' + pageNumber + '</button>');
            button.insertBefore(lastButton);
        }
        i++;
    }
}

function generateHTML(data){
    for(let i=0; i<10; i++){
        let result = $('<div class="result panel"></div>');
        result.append('<img src="https://image.tmdb.org/t/p/w92' + data.results[i].poster_path +  '" class="image"/>');
        result.append('<h4 class="title">' + data.results[i].title + '</h4>');
        result.append('<p class="release_date"><i class="fa fa-calendar" aria-hidden="true"></i>' + data.results[i].release_date + '</p>');
        let content = getGenres(data.results[i].genre_ids);
        result.append('<p class="genre_ids">' + content + '</p>');
        content = data.results[i].overview;
        content = content.length > 100 ? content.slice(0,97) + '...' : content ;
        result.append('<p class="overview">' + content + '<span>Click for more</span></p>');
        result.append('<p class="original_language">' + data.results[i].original_language + '</p>');
        result.append('<p class="vote_average">' + data.results[i].vote_average + '<i class="fa fa-star" aria-hidden="true"></i></p>');
        $("#results_container").append(result);
    }
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


//Event listeners
$(".search_button").click(startSearch);
$("#advanced_search").change(
    function(){
        if (this.checked) {
            showAdvancedSearch();
        } else {
            hideAdvancedSearch();
        }
    });

requestGenres();
requestPopularMovies();
