const pagination = $("#pagination");
let genres = [];
let lastURL = '';
let filteredResult = {};

/*============================== Helper functions =======================================*/
function getTimestamp(dateString){
    return Date.parse(dateString);
}

function sixMonthsAgo(){
    let d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d;
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function cutPageNumberFromURL(){
    return lastURL.slice(0, lastURL.lastIndexOf('=')+1);
}

/*============================== Startup functions =======================================*/

function requestGenres(){
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/genre/movie/list?api_key=48f0555674730b7ab94aaeaf44dd3692&language=en-US',
            method: 'GET'
        }
    ).done(function(data){
        genres = data.genres;
        requestPopularMovies();
    }).fail(function(){
        console.log("Something went wrong in requestGenres");
    });
}

function requestPopularMovies(){
    const d = sixMonthsAgo();
    const year = d.getFullYear();
    const month = d.getMonth()+1;
    const url = 'https://api.themoviedb.org/3/discover/movie?vote_average.gte=6.5&vote_count.gte=2000&primary_release_date.gte='+year+'-'+
        month+'-01&include_video=false&include_adult=false&sort_by=popularity.desc&language=en-US&api_key=48f0555674730b7ab94aaeaf44dd3692&page=1';
    sendRequest(url,'autosearch');
}

/*============================== Search functions =======================================*/

function checkAdvancedSearchStatus(){
    let advSearch = $('#advanced_search');
    let value = advSearch.attr('data-toggle');
    return value === 'true';
}

function toggleAdvancedSearch(){
    let advSearch = $('#advanced_search');
    if(checkAdvancedSearchStatus()){
        hideAdvancedSearch();
        advSearch.attr('data-toggle', 'false');
    } else {
        showAdvancedSearch();
        advSearch.attr('data-toggle', 'true');
    }
}

function showAdvancedSearch(){
    $('#advanced_search').find('.fa').addClass('fa-toggle-on').removeClass('fa-toggle-off');
    $('#clear').text('Clear All');
    $(".search").css("display", "flex");
}

function hideAdvancedSearch(){
    $('#advanced_search').find('.fa').addClass('fa-toggle-off').removeClass('fa-toggle-on');
    $('#clear').text('Clear Title');
    $(".search").css("display", "none");
    $(".search:nth-child(-n+2)").css("display", "flex");
}

function clearInputs(){
    if(checkAdvancedSearchStatus()){
        $('.search input').val('');
    } else {
        $('#title').val('');
    }
}

function startSearch(event, pageSelected = false){
    clearSearchErrors();
    let criterias = checkSearchCriterias(pageSelected);
    if(! $.isEmptyObject(criterias.error)){
        showSearchErrors(criterias.error);
    } else if(criterias){
        searchBy(criterias);
    } else {
        changeMessage('Please enter something to search');
    }
}

function clearSearchErrors(){
    const fieldsWithError = $('.search_container').find('.error');
    if(fieldsWithError){
        changeMessage();
        fieldsWithError.removeClass('error');
    }
}

function showSearchErrors(objErrors){
    let errors = [];
    console.log("showSearchErrors: " , objErrors);
    $.each( objErrors, function( key, value ) {
        $('#'+key).addClass('error');
        errors.push(value);
    });
    changeMessage(errors.join(','), 'red');
}

function checkSearchCriterias(pageSelected = false){
    let result = {};
    result.error = {};
    result.urlParameters = '';
    result.otherCriterias = {};
    if(pageSelected){
        result.page = pageSelected;
    }
    result.title = checkTitle();
    if(checkAdvancedSearchStatus()){
        let criteria = checkDategte();
        if(criteria){
            result.urlParameters += '&primary_release_date.gte=' + criteria;
            result.otherCriterias.dategte = criteria;
        }
        criteria = checkDatelte();
        if(criteria){
            result.urlParameters += '&primary_release_date.lte=' + criteria;
            result.otherCriterias.datelte = criteria;
        }
        criteria = checkGenres();
        if(criteria){
            let validationResult = validateGenres(criteria);
            if(validationResult !== true){
                result.error.genres = "Unknown genre: " + validationResult;
                return result;
            }
            criteria = getGenresId(criteria);
            result.urlParameters += '&with_genres=' + criteria;
            result.otherCriterias.genres = criteria;
        }
        //TODO search by actors
        criteria = checkVotes();
        if(criteria){
            result.urlParameters += '&vote_count.gte=' + criteria;
            result.otherCriterias.votes = criteria;
        }
        criteria = checkRating();
        if(criteria){
            result.urlParameters += '&vote_average.gte=' + criteria;
            result.otherCriterias.rating = criteria;
        }

    }
    console.log('checkSearchCriterias: ', result, typeof result);
    if(result.title === '' && result.urlParameters === '' && $.isEmptyObject(result.otherCriterias)){
        return false;
    } else {
        return result;
    }
}

function checkTitle(){
    const title = $('#title').val();
    return title ? title : '';
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

function checkGenres(){
    let genres = $('#genres');
    if (genres && genres.val()) {
        return genres.val();
    } else {
        return false;
    }
}

function checkVotes(){
    const votes = $('#votes').val();
    return votes ? votes : false;
}

function checkRating(){
    const rating = $('#rating').val();
    return rating ? rating : false;
}

function searchBy(obj){
    if(obj.title){
        requestByTitle(obj.title, obj.page, obj.otherCriterias)
    } else {
        requestByOtherCriterias(obj.page, obj.urlParameters);
    }
}

function requestByTitle(str, page=1, otherCriterias){
    console.log('requestByTitle: ' ,'Other criterias: ', otherCriterias);
    const url = 'https://api.themoviedb.org/3/search/movie?api_key=48f0555674730b7ab94aaeaf44dd3692&query=' +
        encodeURIComponent(str)+'&page='+page;
    sendRequest(url, otherCriterias);
}

function requestByOtherCriterias(page=1, urlParameters){
    let url = 'https://api.themoviedb.org/3/discover/movie?api_key=48f0555674730b7ab94aaeaf44dd3692' +
        '&sort_by=popularity.desc' + urlParameters + '&page=' + page;
    sendRequest(url);
}

function sendRequest(url, otherCriterias=false){
    pagination.attr('data-filtered','false');
    lastURL = url;
    const page = url.slice(url.lastIndexOf('=')+1);
    console.log('sendRequest: Page='+page);
    $.ajax(
        {
            url: url,
            method: 'GET'
        }
    ).done(function(data){
        console.log('sendRequest done: ', data);
        if(otherCriterias == 'autosearch'){
            showResults(data, 1, true);
        } else if(!$.isEmptyObject(otherCriterias)){
            filterEachResultPage(data, otherCriterias);
        } else {
            showResults(data, page);
        }
    }).fail(function(){
        console.log("Something went wrong in sendRequest");
    });
}

function requestPromise(url){
    return $.ajax(
        {
            url: url,
            method: 'GET'
        });
}

function getGenresName(ids){
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

function getGenresId(str){
    let arr = str.split(',');
    arr = arr.map(capitalizeFirstLetter);
    let result = arr.map(function(x){
        for(let i=0; i<genres.length; i++){
            if(x == genres[i].name){
                return genres[i].id;
            }
        }
    });
    result = result.join(',');
    return result;
}

/*============================== Validation functions =======================================*/

function validateGenres(str){
    let errors = [];
    let arr = str.split(',');
    arr = arr.map(capitalizeFirstLetter);
    let genresarr = [];
    $.each(genres, function(i, value){
        genresarr[i] = value.name;
    });
    for (let i=0; i<arr.length; i++){
        if($.inArray(arr[i], genresarr) == -1){
            errors.push(arr[i]);
        }
    }
    if(errors.length > 0){
        return errors.join(',');
    } else {
        return true;
    }
}

/*============================== Result functions =======================================*/

function changeMessage(message='', color='inherit'){
    $('#results_container').find('h2').text(message).css('color', color);
}

function showResults(obj, currentPage = 1, autoSearch = false){
    if(!autoSearch){
        changeMessage('Total Results: ' + obj.total_results);
    } else {
        changeMessage('Popular New Movies');
    }
    $('.page').remove();
    let results = obj.total_results;
    if(results > 20){
        generatePagination(results, currentPage);
    } else {
        pagination.css("display", "none");
    }
    generateHTML(obj.results);
}

function generateHTML(arr){
    //noinspection JSJQueryEfficiency
    $('.result').remove();
    for(let i=0; i<arr.length; i++){
        let result = $('<div class="result panel" data-id="'+ arr[i].id +'"></div>');
        let src = '';
        if(arr[i].poster_path == null){
            src = 'images/no_image.png';
        } else {
            src = 'https://image.tmdb.org/t/p/w92' + arr[i].poster_path;
        }
        result.append('<img src="'  + src + '" class="image"/>');
        result.append('<h4 class="title">' + arr[i].title + '</h4>');
        result.append('<p class="release_date"><i class="fa fa-calendar" aria-hidden="true"></i>' + arr[i].release_date + '</p>');
        let content = getGenresName(arr[i].genre_ids);
        result.append('<p class="genre_ids">' + content + '</p>');
        content = arr[i].overview;
        content = content.length > 100 ? content.slice(0,97) + '...' : content ;
        result.append('<p class="overview">' + content + '<span>Click for more</span></p>');
        result.append('<p class="original_language">' + arr[i].original_language + '</p>');
        result.append('<p class="vote_average">' + arr[i].vote_count + ' \\ ' + arr[i].vote_average + '<i class="fa fa-star" aria-hidden="true"></i></p>');
        $("#results_container").append(result);
    }
    //noinspection JSJQueryEfficiency
    $(".result").click(showDetails);
}

function filterEachResultPage(data, otherCriterias){
    let results = [];
    let promises = [];
    data = filterResults(data, otherCriterias);
    results.push(...data.results);
    for(let i=2; i<=data.total_pages; i++) {
        let url = cutPageNumberFromURL();
        url += i;
        promises.push(requestPromise(url));
    }
    Promise.all(promises).then(function(dataArr) {
        dataArr.forEach(data => {
            const filtered = filterResults(data, otherCriterias);
            results.push(...filtered.results);
        });
        filteredResult = {
            total_results: results.length,
            results: [...results]
        };
        console.log('Filtered Results: ', filteredResult);
        pagination.attr('data-filtered','true');
        const filteredFragment = takeFragment();
        showResults(filteredFragment);
    });
}

function filterResults(data, otherCriterias){
    let resultsLength = data.results.length;
    if(otherCriterias.dategte){
        data.results = data.results.filter(result => getTimestamp(result.release_date) >= getTimestamp(otherCriterias.dategte));
    }
    if(otherCriterias.datelte){
        data.results = data.results.filter(function(result){
            return getTimestamp(result.release_date) <= getTimestamp(otherCriterias.datelte);
        });
    }
    if(otherCriterias.genres){
        let searchelements = otherCriterias.genres.split(',');
        data.results = data.results.filter(function(result){
            let arr = result.genre_ids;
            for(let i=0; i<searchelements.length; i++){
                if(!arr.includes(parseInt(searchelements[i], 10))){
                    return false;
                }
            }
            return true;
        });
    }
    if(otherCriterias.votes){
        data.results = data.results.filter(function(result){
            return result.vote_count >= parseInt(otherCriterias.votes, 10);
        });
    }
    if(otherCriterias.rating){
        data.results = data.results.filter(function(result){
            return result.vote_average >= parseFloat(otherCriterias.rating);
        });
    }
    data.total_results -= (resultsLength - data.results.length);
    return data;
}

function takeFragment(page=1){
    const filteredFragment = {};
    filteredFragment.total_results = filteredResult.total_results;
    filteredFragment.results = filteredResult.results.slice((page*20)-20, page*20);
    return filteredFragment;
}

/*============================== Pagination functions =======================================*/

function generatePagination(results, currentPage){
    console.log('generatePagination: ', 'Current Page: ', currentPage);
    console.log('=====================END===========================');
    const totalPageNumber = Math.ceil(results/20);
    pagination.css("display", "flex");
    showOrHideArrows(currentPage, totalPageNumber);
    const start = calculateStart(currentPage);
    generateButtons(currentPage, totalPageNumber, start);
    pagination.find(".page").click(changePage);
}

function calculateStart(currentPage){
    let result = 0;
    switch (currentPage%3) {
        case 1:
            result = currentPage;
            break;
        case 2:
            result = currentPage - 1;
            break;
        case 0:
            result = currentPage - 2;
            break;
    }
    return result;
}

function showOrHideArrows(currentPage, totalPageNumber){
    const firstButton = pagination.find("button:first-child");
    const backButton = pagination.find("button:nth-child(2)");
    const lastButton = pagination.find("button:last-child");
    if(currentPage == 1 ){
        firstButton.css('display', 'none');
        backButton.css('display', 'none');
        lastButton.css('display', 'block');
    } else if(currentPage > 3 && currentPage != totalPageNumber ){
        firstButton.css('display', 'block');
        backButton.css('display', 'block');
        lastButton.css('display', 'block');
    } else if(currentPage == totalPageNumber ){
        firstButton.css('display', 'block');
        backButton.css('display', 'block');
        lastButton.css('display', 'none');
    } else {
        firstButton.css('display', 'none');
        backButton.css('display', 'block');
        lastButton.css('display', 'block');
    }
}

function generateButtons(currentPage, totalPageNumber, start){
    const lastButton = pagination.find("button:last-child");
    for(let i=1; i<=5; i++){
        let button = '';
        if(i == 4 && totalPageNumber >= start+1){
            button = $('<button class="page" data-page="' + start + '">...</button>');
            button.insertBefore(lastButton);
            start++;
            button = $('<button class="page">' + totalPageNumber + '</button>');
            button.insertBefore(lastButton);
            start++;
            break;
        }
        if(start > totalPageNumber){
            break;
        }
        if(start == currentPage){
            button = $('<button class="page page_selected">'+start+'</button>');
        } else {
            button = $('<button class="page">'+start+'</button>');
        }
        button.insertBefore(lastButton);
        start++;
    }
}

function changePage(){
    const firstButton = pagination.find("button:first-child");
    const backButton = pagination.find("button:nth-child(2)");
    const lastButton = pagination.find("button:last-child");
    const currentPage = pagination.find(".page_selected");
    const prevPage = parseInt(currentPage.text(), 10) - 1;
    const nextPage = parseInt(currentPage.text(), 10) + 1;
    let url = cutPageNumberFromURL();
    if($(this)[0] == firstButton[0]){
        console.log('changePage: ', 'firstButton clicked');
        if(pagination.attr('data-filtered')){
            const filteredFragment = takeFragment();
            showResults(filteredFragment);
            return;
        }
        url += '1';
        sendRequest(url);
    } else if($(this)[0] == backButton[0]){
        console.log('changePage: ', 'backButton clicked');
        if(pagination.attr('data-filtered')){
            const filteredFragment = takeFragment(prevPage);
            showResults(filteredFragment, prevPage);
            return;
        }
        url += prevPage;
        sendRequest(url);
    } else if ($(this)[0] == lastButton[0]){
        console.log('changePage: ', 'lastButton clicked');
        if(pagination.attr('data-filtered')){
            const filteredFragment = takeFragment(nextPage);
            showResults(filteredFragment, nextPage);
            return;
        }
        url += nextPage;
        sendRequest(url);
    } else if($(this).text() == '...'){
        if(pagination.attr('data-filtered')){
            const filteredFragment = takeFragment($(this).attr('data-page'));
            showResults(filteredFragment, $(this).attr('data-page'));
            return;
        }
        url += $(this).attr('data-page');
        sendRequest(url);
    }else {
        console.log('changePage: ', 'other clicked', $(this).text());
        if(pagination.attr('data-filtered')){
            const filteredFragment = takeFragment($(this).text());
            showResults(filteredFragment, $(this).text());
            return;
        }
        url += $(this).text();
        sendRequest(url);
    }
}

/*============================== Detail functions =======================================*/

function showDetails(){
    $('body').addClass('noscroll');
    $('.details_container').css('display', 'block');
    let id = $(this).attr('data-id');
    console.log('Showing details for id: ' + id);
    requestDetails(id);
}

function hideDetails(){
    $('body').removeClass('noscroll');
    $('.details_container').css('display', 'none');
}

function requestDetails(id){
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/movie/' + id + '?api_key=48f0555674730b7ab94aaeaf44dd3692',
            method: 'GET'
        }
    ).done(function(data){
        editDetails(data);
    }).fail(function(){
        console.log("Something went wrong in requestDetails");
    });
}

function editDetails(data) {
    $('.details_container').css({
        'background': 'url("https://image.tmdb.org/t/p/w1280/' + data.backdrop_path + '")',
        'background-size': 'cover',
        'background-position': 'center'
    });
    let imageSource = '';
    if(data.poster_path == null){
        imageSource = 'images/no_image.png';
    } else {
        imageSource = 'https://image.tmdb.org/t/p/w185' + data.poster_path;
    }
    $('.details img').attr({
        src: imageSource
    });
    $('#detais_title').text(data.title);
    $('#details_tagline').text(data.tagline);
    $('#details_release_date').text('Release date: ' + data.release_date);
    $('#details_trailer').attr('href','https://www.youtube.com/results?search_query='+
        encodeURIComponent(data.title+' ' + data.release_date + ' trailer'));
    $('#details_overview').html("<strong>Overview: </strong><br/>" + data.overview);
    //test with very long overview
    //$('#details_overview').html("<strong>Overview:Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur est non reprehenderit voluptas voluptatum. Ad amet deserunt explicabo id ipsam iure laboriosam nam nesciunt pariatur quia, vel velit veniam veritatis!</span><span>Dignissimos dolor excepturi harum nisi officiis sed suscipit, vel. Accusantium distinctio est minus non porro provident quae reiciendis sint vel! Ad adipisci doloremque dolorum exercitationem harum id obcaecati sapiente totam.</span><span>Ad alias atque aut cum dolor illo perspiciatis quod repellendus, veritatis! Accusantium aliquam aspernatur consectetur, cumque dolorum eum excepturi facere laudantium natus numquam odit quo quod repellat repudiandae tenetur, voluptatum.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur est non reprehenderit voluptas voluptatum. Ad amet deserunt explicabo id ipsam iure laboriosam nam nesciunt pariatur quia, vel velit veniam veritatis!</span><span>Dignissimos dolor excepturi harum nisi officiis sed suscipit, vel. Accusantium distinctio est minus non porro provident quae reiciendis sint vel! Ad adipisci doloremque dolorum exercitationem harum id obcaecati sapiente totam.</span><span>Ad alias atque aut cum dolor illo perspiciatis quod repellendus, veritatis! Accusantium aliquam aspernatur consectetur, cumque dolorum eum excepturi facere laudantium natus numquam odit quo quod repellat repudiandae tenetur, voluptatum.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur est non reprehenderit voluptas voluptatum. Ad amet deserunt explicabo id ipsam iure laboriosam nam nesciunt pariatur quia, vel velit veniam veritatis!</span><span>Dignissimos dolor excepturi harum nisi officiis sed suscipit, vel. Accusantium distinctio est minus non porro provident quae reiciendis sint vel! Ad adipisci doloremque dolorum exercitationem harum id obcaecati sapiente totam.</span><span>Ad alias atque aut cum dolor illo perspiciatis quod repellendus, veritatis! Accusantium aliquam aspernatur consectetur, cumque dolorum eum excepturi facere laudantium natus numquam odit quo quod repellat repudiandae tenetur, voluptatum.</strong><br/>" + data.overview);

}

/*============================== Event listeners =======================================*/

$("#advanced_search").click(toggleAdvancedSearch);
$("#clear").click(clearInputs);
$("#search").click(startSearch);
$('.search input').keypress(function(e) {
    if(e.which == 13) {
        startSearch();
    }
});
$(".details .fa-times").click(hideDetails);
pagination.find("button:first-child").click(changePage);
pagination.find("button:nth-child(2)").click(changePage);
pagination.find("button:last-child").click(changePage);

requestGenres();
