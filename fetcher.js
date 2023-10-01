const token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImEwMTI4MzE4MUB0ZWMubXgiLCJ1dWlkIjoiMDBiOTE0NjYtNjI4MS00NmI5LThkNjItZDU5YjJjOWE2NjJhIiwicGFzc3dvcmRIYXNoIjoiJDJhJDEwJEExcVA1QWtrLjVJSWdHOGs1aHV6c3U4ejRsMmNSZkdOY05INDV3Z2I1aDVhWFA2dm5odzRhIiwiaWF0IjoxNjk1OTE3NTMyLCJleHAiOjE2OTU5MjExMzJ9.pBlTluT5liZI46qR_spPxsKWI15rC2prg4iQ2YrK6jKC8_RpjcsMtssw0TwtOfcsf0SOWLcUZe3Gw9WA4708ag';
fetch('http://localhost:3001/groups/5843ab76-d1e9-4b8a-bd30-94280c11645d/members/accept/00b91466-6281-46b9-8d62-d59b2c9a662a', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    },
})
    .then(async (response) => console.log(await response.text()));
