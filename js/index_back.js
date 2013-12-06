/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var db;
$('#reposHome').bind('pageinit', function(event) {
    loadRepos();
    db = window.openDatabase("repodb","0.1","GitHub Repo Db", 1000);
    db.transaction(createDb, txError, txSuccess);
});
$(document).on("pageshow", "#scanHome", function() {
	$("#beginScan").bind("click", function(){
//		alert("Begin scan");
		/* Phonegap BarcodeScanner Plugin */
		try {
//		scanner = cordova.require("com.phonegap.plugins.barcodescanner.BarcodeScanner");
		var scanner = cordova.require("cordova/plugin/BarcodeScanner");
		alert('scanner loaded');
		navigator.notification.vibrate(1000);
		}
		catch(e) {
		alert('scanner could not be loaded');
		navigator.notification.vibrate(1000);
		navigator.notification.vibrate(1000);
		}
		
		scanner.scan( function (result) { 

            alert("We got a barcode\n" + 
            "Result: " + result.text + "\n" + 
            "Format: " + result.format + "\n" + 
            "Cancelled: " + result.cancelled);  

           console.log("Scanner result: \n" +
                "text: " + result.text + "\n" +
                "format: " + result.format + "\n" +
                "cancelled: " + result.cancelled + "\n");
            document.getElementById("info").innerHTML = result.text;
            console.log(result);
            /*
            if (args.format == "QR_CODE") {
                window.plugins.childBrowser.showWebPage(args.text, { showLocationBar: false });
            }
            */

        }, function (error) { 
            console.log("Scanning failed: ", error); 
        });
	});
});

$('#scan').on('click', function(event){
	$.mobile.changePage("scan.html");
});
function createDb(tx) {
    tx.executeSql("DROP TABLE IF EXISTS repos");
    tx.executeSql("CREATE TABLE repos(user,name)");
}

function txError(error) {
    console.log(error);
    console.log("Database error: " + error);
}

function txSuccess() {
    console.log("DB repos created");
}
function saveFave() {
    db = window.openDatabase("repodb","0.1","GitHub Repo Db", 1000);
    db.transaction(saveFaveDb, txError, txSuccessFave);
}

function saveFaveDb(tx) {
    var owner = getUrlVars().owner;
    var name = getUrlVars().name;

    tx.executeSql("INSERT INTO repos(user,name) VALUES (?, ?)",[owner,name]);
}

function txSuccessFave() {
    console.log("Save success");
    disableSaveButton();
}
//$('#reposHome').bind("pageinit", function() {
//	loadRepos();
//});

//Au chargement de la nouvelle page
$(document).on("pageshow", "#reposDetail", function() {
    var owner = getUrlVars().owner;
    var name = getUrlVars().name;
    loadRepoDetail(owner,name);
	$("#saveBtn").bind("click", saveFave);
	$("#testDet").bind("click", function(){
		console.log("testDet clicked");
		$("#testDet").html("clicked");
		navigator.notification.alert(
	            'You are the winner!',  // message
	            alertDismissed,         // callback
	            'Game Over',            // title
	            'Done'                  // buttonName
	        );
		playBeep();
		navigator.notification.vibrate(1000);
	});
    checkFave();
});
function playBeep() {
    navigator.notification.beep(3);
}
function checkFave() {
    db.transaction(checkFaveDb, txError);
}

function checkFaveDb(tx) {
    var owner = getUrlVars().owner;
    var name = getUrlVars().name;

    tx.executeSql("SELECT * FROM repos WHERE user = ? AND name = ?",[owner,name],txSuccessCheckFave);
}

function txSuccessCheckFave(tx,results) {
    console.log("Read success");
    console.log(results);

    if (results.rows.length)
         disableSaveButton();
}
function disableSaveButton() {
    // change the button text and style
    var ctx = $("#saveBtn").closest(".ui-btn");
    $('span.ui-btn-text',ctx).text("Saved").closest(".ui-btn-inner").addClass("ui-btn-up-b");
    $("#saveBtn").unbind("click", saveFave);
}

function loadRepos() {
    $.ajax("https://api.github.com/legacy/repos/search/javascript").done(function(data) {
        var i, repo;
        $.each(data.repositories, function (i, repo) {
            $("#allRepos").append("<li><a href='repo-detail.html?owner=" + repo.username + "&name=" + repo.name + "'>"
            + "<h4>" + repo.name + "</h4>"
            + "<p>" + repo.username + "</p></a></li>");
        });
        $('#allRepos').listview('refresh');
    });
}

$(document).on("pageshow", "#favesHome", function(event) {
	console.log("pageshow #favesHome");
    db.transaction(loadFavesDb, txError, txSuccess);
});

function loadFavesDb(tx) {
    tx.executeSql("SELECT * FROM repos",[],txSuccessLoadFaves);
}
function txSuccessLoadFaves(tx,results) {
    console.log("Read success");

    if (results.rows.length) {
        var len = results.rows.length;
        var repo;
        for (var i=0; i < len; i = i + 1) {
            repo = results.rows.item(i);
            console.log(repo);
            $("#savedItems").append("<li><a href='repo-detail.html?owner=" + repo.user + "&name=" + repo.name + "'>"
            + "<h4>" + repo.name + "</h4>"
            + "<p>" + repo.user + "</p></a></li>");
        };
        $('#savedItems').listview('refresh');
    } else {
    	console.log('not items found');
    	$("#savedItems").append("<li>not items found</li><h4>No Items found at all</h4>");
	   if (navigator.notification){
           navigator.notification.alert("You haven't saved any favorites yet.", alertDismissed);
	   }
    }
}
function alertDismissed() {
    $.mobile.changePage("index.html");
}


//Récupère les paramètres d'une URL
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function loadRepoDetail(owner,name) {
    $.ajax("https://api.github.com/repos/" + owner + "/" + name).done(function(data) {
        var repo = data;
        console.log(data);

        $('#repoName').html("<a href='" + repo.homepage + "'>" + repo.name + "</a>");
        $('#description').text(repo.description);
        $('#forks').html("<strong>Forks:</strong> " + repo.forks + "<br><strong>Watchers:</strong> " + repo.watchers);
        $('#avatar').attr('src', repo.owner.avatar_url);
        $('#ownerName').html("<strong>Owner:</strong> <a href='" + repo.owner.url + "'>" + repo.owner.login + "</a>");
    });
}



var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        console.log("app.initialize");
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};
