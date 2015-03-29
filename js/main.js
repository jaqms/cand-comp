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
	this.id = json['gsx$name']['$t'];
	this.name = json['gsx$name']['$t'];
	this.slug = json['gsx$slug']['$t'];
	this.icon = json['gsx$icon']['$t'];
	this.color = json['gsx$color']['$t'];
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
		if (i.indexOf("gsx") === 0) {
			this.bioData[i.substring(4)] = json[i]['$t'];
		}
	}.bind(this));
}

Candidate.prototype.setIssueData = function (json) {
	Object.keys(json).forEach(function (i) {
		if (i.indexOf("gsx") === 0) {
			this.issueData[i.substring(4)] = json[i]['$t'];
		}
	}.bind(this));
}

function getGoogleSheet(id, callback) {
	$.getJSON("https://spreadsheets.google.com/feeds/list/1y4BwQfdE0-isBz8VptmS0n_52TyLRv7BPLp5K5QHqho/" + id + "/public/values?alt=json",
		function (data) {
			callback(data)
		});
}

function showIssuesPage() {
	displayPage('#issues-page');

	issueCollection.issues.forEach(function (issue) {
		var source = $('#template-issue-tile').html();
		var template = Handlebars.compile(source);
		var html = template(issue);
		var tile = $(html);
		tile.bind('click', function (issue) {
			showIssueDetailPage(issue);
		}.bind(tile, issue));
		$('#issue-tile-list').append(tile);
	})
}

function showCandidatesPage() {
	displayPage('#candidates-page');

	candidateCollection.candidates.forEach(function (candidate) {
		var source = $('#template-candidate-tile').html();
		var template = Handlebars.compile(source);
		var html = template({'name': candidate.bioData.name});
		var tile = $(html);
		$('#candidate-tile-list').append(tile);
	})
}

function showAboutPage() {
	displayPage('#about-page');
}

function showIssueDetailPage(issue) {
	displayPage('#issue-detail-page', issue);
	candidateCollection.candidates.forEach(function (candidate) {
		var issueNameKey = issue.id.replace(/ /g, '').toLowerCase();
		var source = $('#template-candidate-issue').html();
		var template = Handlebars.compile(source);
		var html = template({'name': candidate.bioData.name, 'text': candidate.issueData[issueNameKey]});
		var row = $(html);
		$('#candidate-issue-list').append(row);
	});
}

function displayPage(templateTag, data) {
	var source = $(templateTag).html();
	var template = Handlebars.compile(source);
	var html = template(data || {});
	$('#page-holder').html(html);
}

window.onload = function () {
	window.issueCollection = new IssueCollection();
	window.candidateCollection = new CandidateCollection();

	window.ISSUE_SHEET_ID = 4;
	window.CANDIDATE_BIO_SHEET_ID = 2;
	window.CANDIDATE_ISSUE_SHEET_ID = 3;
	
	getGoogleSheet(ISSUE_SHEET_ID, function (data) {
		data['feed']['entry'].forEach(function (entry) {
			var issue = new Issue(entry);
			issueCollection.add(issue);
		});

		showIssuesPage();

		getGoogleSheet(CANDIDATE_BIO_SHEET_ID, function (data) {
			data['feed']['entry'].forEach(function (entry) {
				var candidate = new Candidate(entry['gsx$name']['$t']);
				candidate.setBioData(entry);
				candidateCollection.add(candidate);
			});
			
			getGoogleSheet(CANDIDATE_ISSUE_SHEET_ID, function (data) {
				data['feed']['entry'].forEach(function (entry) {
					var candidate = candidateCollection.findByName(entry['gsx$name']['$t']);
					if (candidate) {
						candidate.setIssueData(entry);
					}
				});
			});
		});
	});

	$(window).bind('hashchange', function(e) {
		var page = document.URL.substring(document.URL.indexOf('#')+1);
		
		if (page.indexOf("issues") === 0) {
			if (page.indexOf("/") < 0) {
				showIssuesPage();
			}
		}
		else if (page.indexOf("candidates") === 0) {
			showCandidatesPage();
		}
		else if (page.indexOf("about") === 0) {
			showAboutPage();
		}
	});
}