Handlebars.registerHelper("debug", function(optionalValue) {
  console.log("Current Context");
  console.log("====================");
  console.log(this);

  if (optionalValue) {
    console.log("Value");
    console.log("====================");
    console.log(optionalValue);
  }
});

Handlebars.registerHelper('is', function(v1, v2, options) {{
	return (v1 === v2 ? options.fn(this) : options.inverse(this));
}})

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
	this.id = json['gsx$name']['$t'].replace(/ /g, '').toLowerCase();
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

Candidate.formatIssueText = function (text) {
	if (text.length === 0) {
		return "n/a"
	}
	var parts = text.split('; ');
	if (parts.length > 0) {
		var finalText = "";
		parts.forEach(function (part) {
			console.log(part)
			var subParts = part.split(': ');
			var newText = "<b>" + subParts[0] + "</b>: " + subParts[1] + "<br />";
			finalText += newText;
		});
		return finalText;
	}
	return text;
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

function setTitle(title) {
	$('.navbar-brand').html(title || '');
}

function showIssuesPage() {
	displayPage('#issues-page');
	setTitle('The Issues');

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
	setTitle('Candidates');

	candidateCollection.candidates.forEach(function (candidate) {
		var source = $('#template-candidate-tile').html();
		var template = Handlebars.compile(source);
		var html = template({'pic': candidate.bioData.pic, 'name': candidate.bioData.name});
		var tile = $(html);
		tile.bind('click', function (candidate) {
			showCandidateDetailPage(candidate);
		}.bind(tile, candidate));
		$('#candidate-tile-list').append(tile);
	})
}

function showAboutPage() {
	displayPage('#about-page');
	setTitle();
}

function hideIssueDetailNav() {
	var navHolder = $('#issue-detail-nav-holder');
	navHolder.empty();
}

function showIssueDetailNav(issue) {
	var navHolder = $('#issue-detail-nav-holder');

	if (navHolder.is(':empty')) {
		var source = $('#template-issue-detail-nav').html();
		var template = Handlebars.compile(source);
		var html = template($.extend({'issues': issueCollection.issues}, issue));
		navHolder.html(html);
	}

	activateIssueInNav(issue);
	centerIssueInNav(issue);
}

function activateIssueInNav(issue) {
	var navHolder = $('#issue-detail-nav-holder');
	navHolder.find('li').removeClass('active');
	navHolder.find('a[href="#issues/' + issue.name + '"]').parent().addClass('active');
}

function centerIssueInNav(issue) {
	var navHolder = $('#issue-detail-nav-holder');
	var navList = navHolder.find('.issue-detail-nav');
	var activeTab = navList.find('.active');
	var lastTab = navList.find('li:last-child');

	var currentScrollX = navList.scrollLeft();
	var activeTabX = activeTab.position().left;
	var centeredX = (navHolder.width() - activeTab.width()) / 2;

	navList.animate({scrollLeft: activeTabX + currentScrollX - centeredX});
}

function showIssueDetailPage(issue) {
	var foundIssue = issueCollection.findByName(issue.id);
	displayPage('#issue-detail-page', foundIssue);
	setTitle('The Issues');

	candidateCollection.candidates.forEach(function (candidate) {
		var source = $('#template-candidate-issue').html();
		var template = Handlebars.compile(source);
		var html = template({
			'pic': candidate.bioData.pic,
			'name': candidate.bioData.name,
			'text': Candidate.formatIssueText(candidate.issueData[issue.id])
		});
		var row = $(html);
		$('#candidate-issue-list').append(row);
	});

	$('.candidate-issue .show-more a').on('click', function(evt) {
		evt.preventDefault();
		var target = evt.currentTarget;
		expandCandidateIssue($(target).closest('.candidate-issue'));
	});
}

function showCandidateDetailPage(candidate) {
	displayPage('#candidate-detail-page', candidate.bioData);
	setTitle('Candidates');

	Object.keys(candidate.issueData).forEach(function (issueKey) {
		var matchingIssue = issueCollection.findByName(issueKey);
		if (issueKey === 'name' || !matchingIssue)
			return;

		var source = $('#template-profile-issue').html();
		var template = Handlebars.compile(source);
		var html = template({
			'name': matchingIssue.name,
			'text': Candidate.formatIssueText(candidate.issueData[issueKey])
		});
		var row = $(html);
		$('#profile-issue-list').append(row);
	});
}

function displayPage(templateTag, data) {
	if (templateTag === '#issue-detail-page') {
		showIssueDetailNav(data);
	} else {
		hideIssueDetailNav();
	}

	var source = $(templateTag).html();
	var template = Handlebars.compile(source);
	var html = template(data || {});
	$('#page-holder').html(html);
}

function expandCandidateIssue($el) {
	$el.toggleClass('expanded');
	$el.find('.expand-icon').toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
}

function goToPage() {
	var page = document.URL.substring(document.URL.indexOf('#')+1);
	var parts = page.split('/');

	$('.navbar-nav li').removeClass('active');
	$('.navbar-nav').find('[href="#' + page + '"]').parent().addClass('active');

	if (page.indexOf("issues") === 0) {
		if (page.indexOf("/") < 0) {
			showIssuesPage();
		} else if (parts.length === 2) {
			showIssueDetailPage({id: parts[1].replace(/ /g, '').toLowerCase()});
		}
	}
	else if (page.indexOf("candidates") === 0) {
		showCandidatesPage();
	}
	else if (page.indexOf("about") === 0) {
		showAboutPage();
	}
}

window.onload = function () {
	window.issueCollection = new IssueCollection();
	window.candidateCollection = new CandidateCollection();

	window.ISSUE_SHEET_ID = 4;
	window.CANDIDATE_BIO_SHEET_ID = 3;
	window.CANDIDATE_ISSUE_SHEET_ID = 2;

	getGoogleSheet(ISSUE_SHEET_ID, function (data) {
		data['feed']['entry'].forEach(function (entry) {
			var issue = new Issue(entry);
			issueCollection.add(issue);
		});

		getGoogleSheet(CANDIDATE_BIO_SHEET_ID, function (data) {
			console.log(data)
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

				goToPage();
				// showIssuesPage();

			});
		});
	});

	$(window).bind('hashchange', function(e) {
		goToPage();
	});
}