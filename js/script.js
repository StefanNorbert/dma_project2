let genres = [];

function requestGenres(){
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/genre/movie/list?api_key=48f0555674730b7ab94aaeaf44dd3692&language=en-US',
            method: 'GET'
        }
    ).done(function(data){
        genres = data.genres;
    });
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

function searchBy(object){
    $.each(object, function(property, value){
        property = property.substr(0,1).toUpperCase()+property.substr(1);
        let functionName = "searchBy" + property;
        eval(functionName + "('" + value + "')");
        //let result = eval(functionName + "('" + value + "')");
        //console.log(result);
    });
}

//noinspection JSUnusedLocalSymbols
function searchByTitle(string){
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/search/movie?api_key=48f0555674730b7ab94aaeaf44dd3692&query='+encodeURIComponent(string),
            method: 'GET'
        }
    ).done(function(data){
        console.log(data);
        showResults(data);
    });
}

//noinspection JSUnusedLocalSymbols
function searchByYear(string){
    console.log("by year " + string);
}

function showResults(data){
    const container = $(".results_container");
    console.log(data.results[0]);
    container.append('<img src="https://image.tmdb.org/t/p/w92' + data.results[0].poster_path +  '">');
    container.append('<h4 class="title">' + data.results[0].title + '</h4>');
    container.append('<p class="release_date">' + data.results[0].release_date + '</p>');
    container.append('<p class="overview">' + data.results[0].overview + '</p>');
    container.append('<p class="vote_average">' + data.results[0].vote_average + '</p>');
    container.append('<p class="original_language">' + data.results[0].original_language + '</p>');
    let content = '';
    $.each(data.results[0].genre_ids,function(i, id){
        for(let j=0; j<genres.length; j++){
            if(genres[j].id === id){
                content += '<span>' + genres[j].name + '</span>';
            }
        }
    });
    //container.append('<p class="genre_ids"></p>');
    //requestGenres(showGenres,data.results[0].genre_ids);
    container.append('<p class="genre_ids">' + content + '</p>');
}

//function requestGenres(callback,ids){
//    $.ajax(
//        {
//            url: 'https://api.themoviedb.org/3/genre/movie/list?api_key=48f0555674730b7ab94aaeaf44dd3692&language=en-US',
//            method: 'GET'
//        }
//    ).done(function(data){
//        callback(data.genres,ids);
//    });
//}

//function showGenres(data,ids){
//    console.log(data);
//    console.log(ids);
//    let genre = $(".genre_ids");
//    $.each(ids,function(i, id){
//        for(let j=0; j<data.length; j++){
//            if(data[j].id === id){
//                genre.append('<span>' + data[j].name + '</span>');
//            }
//        }
//    });
//}

requestGenres();
$(".search_button").click(startSearch);