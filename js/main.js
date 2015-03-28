function IssueCollection(json) {
	this.issues = [];
}

IssueCollection.prototype.add = function (issue) {
	this.issues.push(issue);
}

IssueCollection.prototype.findByName = function (name) {
	var issueFind = this.issues.filter(function (c) {
		return c.id === name;
	});
	
	if (issueFind.length === 1)
		return issueFind[0];
	else
		return null;
}

function Issue(json) {
	this.id = json['gsx$name']
	this.name = json['gsx$name'];
	this.slug = json['gsx$slug'];
	this.icon = json['gsx$icon'];
	this.color = json['gsx$color'];
}

function CandidateCollection() {
	this.candidates = [];
}

CandidateCollection.prototype.add = function (candidate) {
	this.candidates.push(candidate);	
}

CandidateCollection.prototype.findByName = function (name) {
	var candidateFind = this.candidates.filter(function (c) {
		return c.id === name;
	});
	
	if (candidateFind.length === 1)
		return candidateFind[0];
	else
		return null;
}

function Candidate(id) {
	this.id = id;
	this.bioData = {};
	this.issueData = {};
}

Candidate.prototype.setBioData = function (json) {
	Object.keys(json).forEach(function (i) {
		if (i.indexOf("gsx") === 0 && i !== 'gsx$name') {
			this.bioData[i.substring(4)] = json[i]['$t'];
		}
	});
}

Candidate.prototype.setIssueData = function (json) {
	Object.keys(json).forEach(function (i) {
		if (i.indexOf("gsx") === 0 && i !== 'gsx$name') {
			this.issueData[i.substring(4)] = json[i]['$t'];
		}
	});
}


function getGoogleSheet(id, callback) {
	$.getJSON("https://spreadsheets.google.com/feeds/list/1y4BwQfdE0-isBz8VptmS0n_52TyLRv7BPLp5K5QHqho/" + id + "/public/values?alt=json",
		function (data) {
			callback(data)
		});
}

function showPage(templateTag) {
	var source = $(templateTag).html();
	var template = Handlebars.compile(source);
	var html = template({});
	$('#page-holder').html(html);
}

window.onload = function () {
	window.issues = new IssueCollection();
	window.candidates = new CandidateCollection();
	
	/*getGoogleSheet(3, function (data) {
		data['feed']['entry'].forEach(function (entry) {
			var issue = new Issue(entry);
			issueCollection.add(candidate);
		});

		getGoogleSheet(2, function (data) {
			data['feed']['entry'].forEach(function (entry) {
				var candidate = new Candidate(entry['gsx$name']['$t']);
				candidate.setBioData(entry);
				candidateCollection.add(candidate);
			});
			
			getGoogleSheet(1, function (data) {
				data['feed']['entry'].forEach(function (entry) {
					var candidate = candidateCollection.findByName(entry['gsx$name']['$t']);
					if (candidate) {
						candidate.setIssueData(entry);
					}
				});
			});
		});
	});*/

	$(window).bind('hashchange', function(e) {
		var page = document.URL.substring(document.URL.indexOf('#')+1);
		switch (page) {
			case "issues":
				showPage('#issues-page');
				break;
			case "candidates":
				showPage('#candidates-page');
				break;
			case "about":
				showPage('#about-page');
				break;
		}
	});

	showPage('#issues-page');
}