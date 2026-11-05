"""Idempotently create a real Project, sprint views and actual-state field values."""

import argparse
from datetime import datetime, timezone
import json
import re

from project_data import BASELINE, OUT, REPO, ROOT, collect, gh, graphql

OWNER = 'nvtank'
TITLE = 'TixFlow V2 Delivery'
STATUSES = ['Backlog', 'In Progress', 'In Review', 'Done']
FIELD_TYPES = {
    'Sprint':'SINGLE_SELECT', 'Priority':'SINGLE_SELECT', 'Story Points':'NUMBER',
    'WBS':'TEXT', 'Module':'TEXT', 'DRI':'TEXT', 'Estimate status':'TEXT',
    'Start date':'DATE', 'Target date':'DATE', 'Actual Start':'DATE', 'Actual Done':'DATE',
    'First evidence':'DATE', 'Evidence URL':'TEXT', 'Baseline iteration':'ITERATION',
}
FIELDS_QUERY = '''query($id:ID!){node(id:$id){... on ProjectV2{fields(first:100){nodes{
__typename ... on ProjectV2Field{id name dataType}
... on ProjectV2SingleSelectField{id name dataType options{id name color description}}
... on ProjectV2IterationField{id name dataType configuration{duration iterations{id title startDate duration} completedIterations{id title startDate duration}}}
}} views(first:100){nodes{id name layout filter number
verticalGroupByFields(first:10){nodes{... on ProjectV2Field{id name} ... on ProjectV2SingleSelectField{id name} ... on ProjectV2IterationField{id name}}}
groupByFields(first:10){nodes{... on ProjectV2Field{id name} ... on ProjectV2SingleSelectField{id name} ... on ProjectV2IterationField{id name}}}
}}}}}'''


def field_state(project_id):
    return graphql(FIELDS_QUERY, id=project_id)['node']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--skip-collect', action='store_true')
    parser.add_argument('--views-only', action='store_true')
    opts = parser.parse_args()
    if not opts.apply:
        print(json.dumps({'dry_run':True, 'title':TITLE, 'statuses':STATUSES,
                          'fields':FIELD_TYPES, 'views':['Board','Table','Sprint 1','Sprint 2','Baseline Roadmap','By Owner','Blocked','Done'],
                          'metrics':'actual GitHub issue events, not reconstructed commit dates'}, indent=2))
        return
    if gh('api','user')['login'] != OWNER:
        raise RuntimeError('Expected authenticated nvtank account')
    live = json.loads((OUT/'live-data.json').read_text()) if opts.skip_collect else collect()
    result = {'observed_at':datetime.now(timezone.utc).isoformat(), 'status':'IN_PROGRESS',
              'repository':REPO, 'actual_history_only':True, 'errors':[]}
    OUT.mkdir(exist_ok=True, parents=True)
    result_path = OUT/'github-project.json'

    def save():
        result_path.write_text(json.dumps(result, indent=2, ensure_ascii=False)+'\n')

    try:
        projects = gh('project','list','--owner',OWNER,'--limit','1000','--format','json')['projects']
        matches = [p for p in projects if p['title'] == TITLE]
        if len(matches)>1:
            raise RuntimeError('Duplicate project title; refusing to guess')
        project = matches[0] if matches else gh('project','create','--owner',OWNER,'--title',TITLE,'--format','json')
        pid, number = project['id'], str(project['number'])
        result.update(project_id=pid, number=int(number), url=project['url'])
        save()
        gh('project','link',number,'--owner',OWNER,'--repo',REPO)
        readme = '''# TixFlow V2 — actual delivery data

This Project tracks real GitHub Issues/PRs. Baseline Sprint 1 is 2026-09-07–09-20 and Sprint 2 is 2026-09-21–10-04; these are **planned dates**, not proof of execution during those periods. The full issue/event export records the actual timestamps GitHub observed. No old state transitions are backfilled.

The import commits' reconstructed role/date metadata is not used for statuses, actual completion dates or charts. Story Points remain PROPOSED estimates. Actual Start is left unset unless actual start evidence is explicitly recorded; First evidence comes from a linked PR creation date.

## Real burndown snapshots

![Sprint 1 actual burndown](https://raw.githubusercontent.com/nvtank/ticketflowv2/main/docs/project/burndown-s1.svg)
![Sprint 2 actual burndown](https://raw.githubusercontent.com/nvtank/ticketflowv2/main/docs/project/burndown-s2.svg)

[Source events and CSV](https://github.com/nvtank/ticketflowv2/tree/main/docs/project). The plotted interval begins with actual Issue creation, not an invented September history. Charts are published after the metrics PR merges.

Views: Board, Table, Sprint 1, Sprint 2, Baseline Roadmap, By Owner, Blocked, Done. Native Insights is available from this Project; GitHub exposes no public chart-creation mutation, so reproducible burndown SVG/PNG charts are linked here rather than claiming a native chart was created by API.
'''
        graphql('''mutation($input:UpdateProjectV2Input!){updateProjectV2(input:$input){projectV2{id}}}''',
                input={'projectId':pid,'public':True,'shortDescription':'Actual issue/PR history; S1/S2 baseline plans and reproducible real-event burndown.', 'readme':readme})
        state = field_state(pid)
        fields = {f['name']:f for f in state['fields']['nodes']}
        status = fields['Status']
        existing = {o['name'].lower():o for o in status['options']}
        options = []
        colors = ['GRAY','YELLOW','PURPLE','GREEN']
        for name,color in zip(STATUSES, colors):
            old = existing.get(name.lower()) or (existing.get('todo') if name=='Backlog' else None)
            option = {'name':name,'color':color,'description':name}
            if old: option['id']=old['id']
            options.append(option)
        used = {o.get('id') for o in options}
        options += [{k:o[k] for k in ('id','name','color','description')} for o in status['options'] if o['id'] not in used]
        if [o['name'] for o in status['options']] != [o['name'] for o in options]:
            graphql('''mutation($input:UpdateProjectV2FieldInput!){updateProjectV2Field(input:$input){projectV2Field{... on ProjectV2SingleSelectField{id}}}}''', input={'fieldId':status['id'],'singleSelectOptions':options})
        for name,kind in FIELD_TYPES.items():
            if name in fields: continue
            data = {'projectId':pid,'name':name,'dataType':kind}
            if kind=='SINGLE_SELECT':
                values=list(BASELINE) if name=='Sprint' else ['P0','P1','P2']
                data['singleSelectOptions']=[{'name':value,'color':'BLUE','description':value} for value in values]
            if kind=='ITERATION':
                data['iterationConfiguration']={'duration':14,'startDate':'2026-08-31','iterations':[
                    {'title':title,'startDate':dates[0],'duration':dates[2]} for title,dates in BASELINE.items()]}
            graphql('''mutation($input:CreateProjectV2FieldInput!){createProjectV2Field(input:$input){projectV2Field{... on ProjectV2Field{id} ... on ProjectV2SingleSelectField{id} ... on ProjectV2IterationField{id}}}}''',input=data)
        state=field_state(pid);fields={f['name']:f for f in state['fields']['nodes']}
        status_options={o['name']:o['id'] for o in fields['Status']['options']}
        selects={name:{o['name']:o['id'] for o in fields[name]['options']} for name in ['Sprint','Priority']}
        iteration_config=fields['Baseline iteration']['configuration']
        iterations={i['title']:i['id'] for i in iteration_config['iterations']+iteration_config['completedIterations']}
        # Gather existing content/items without relying on unsupported gh item-list limits.
        items={};cursor=None
        while True:
            response=graphql('''query($id:ID!,$cursor:String){node(id:$id){... on ProjectV2{items(first:100,after:$cursor){nodes{id content{... on Issue{id number}} fieldValues(first:30){nodes{... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2SingleSelectField{name}}}}}} pageInfo{hasNextPage endCursor}}}}}''',id=pid,cursor=cursor)['node']['items']
            for item in response['nodes']:
                if (item.get('content') or {}).get('number'):
                    items[item['content']['number']]=item
            if not response['pageInfo']['hasNextPage']:break
            cursor=response['pageInfo']['endCursor']
        for issue in live['issues']:
            if issue['number'] not in items:
                item=graphql('''mutation($input:AddProjectV2ItemByIdInput!){addProjectV2ItemById(input:$input){item{id}}}''',input={'projectId':pid,'contentId':issue['node_id']})['addProjectV2ItemById']['item']
                items[issue['number']]={'id':item['id'],'fieldValues':{'nodes':[]}}
        api_headers=['-H','X-GitHub-Api-Version: 2026-03-10']
        rest_fields=gh('api',f'users/{OWNER}/projectsV2/{number}/fields',*api_headers)
        rest_field_ids={field['name']:field['id'] for field in rest_fields}
        rest_items=gh('api',f'users/{OWNER}/projectsV2/{number}/items?per_page=100',*api_headers)
        rest_item_ids={item['node_id']:item['id'] for item in rest_items}
        updates=[];expected=[]
        for issue in live['issues']:
            item=items[issue['number']]
            related=[p for p in live['pull_requests'] if issue['number'] in {int(n) for n in re.findall(r'#(\d+)\b',p.get('body') or '')}]
            related.sort(key=lambda p:p['created_at'])
            open_prs=[p for p in related if p['state']=='open']
            current=next((v['name'] for v in item['fieldValues']['nodes'] if v.get('field',{}).get('name')=='Status'),None)
            desired='Done' if issue['state']=='closed' and issue.get('state_reason')!='not_planned' else 'In Review' if open_prs else 'In Progress' if related or issue['number']==5 else 'Backlog'
            # Preserve a human-chosen active state when no API lifecycle event contradicts it.
            if desired=='Backlog' and current in ('In Progress','In Review'):desired=current
            baseline_sprint=issue.get('baseline_sprint',issue['sprint'])
            date_start,date_end,_=BASELINE[baseline_sprint]
            values={
                'Status':{'singleSelectOptionId':status_options[desired]},
                'Sprint':{'singleSelectOptionId':selects['Sprint'][issue['sprint']]},
                'Priority':{'singleSelectOptionId':selects['Priority'][issue['priority']]},
                'Story Points':{'number':issue['points']}, 'Estimate status':{'text':'PROPOSED'},
                'WBS':{'text':issue['wbs']},'Module':{'text':issue['module']},
                'DRI':{'text':issue['proposed_dri']},
                'Start date':{'date':date_start},'Target date':{'date':issue.get('target_date') or date_end},
                'Baseline iteration':{'iterationId':iterations[baseline_sprint]},
                'Evidence URL':{'text':(open_prs[-1]['html_url'] if open_prs else related[-1]['html_url'] if related else issue['url'])},
            }
            if related:values['First evidence']={'date':related[0]['created_at'][:10]}
            values['Actual Done']={'date':issue['closed_at'][:10] if issue['closed_at'] and desired=='Done' else None}
            updates.append((rest_item_ids[item['id']], [{'id':rest_field_ids[name],'value':next(iter(value.values()))} for name,value in values.items()]))
            expected.append({'issue':issue['number'],'item_id':item['id'],'status':desired,'sprint':issue['sprint'],'actual_done':issue['closed_at'] if desired=='Done' else None})
        # REST supports all field values for an item in one request and avoids
        # serial GraphQL-alias mutations exceeding the upstream proxy timeout.
        for position,(item_id,values) in enumerate([] if opts.views_only else updates,1):
            gh('api','--method','PATCH',f'users/{OWNER}/projectsV2/{number}/items/{item_id}',*api_headers,payload={'fields':values})
            print(f'Updated actual item fields {position}/{len(updates)}',flush=True)
        visible=[fields[name]['id'] for name in ['Title','Status','Assignees','Sprint','Priority','Story Points','DRI','WBS','Start date','Target date','Actual Done','Evidence URL'] if name in fields]
        views={v['name']:v for v in state['views']['nodes']}
        specs=[('Board','BOARD_LAYOUT',''),('Table','TABLE_LAYOUT',''),('Sprint 1','BOARD_LAYOUT','sprint:S1'),('Sprint 2','BOARD_LAYOUT','sprint:S2'),('Baseline Roadmap','ROADMAP_LAYOUT',''),('By Owner','TABLE_LAYOUT',''),('Blocked','BOARD_LAYOUT','label:"status:blocked"'),('Done','TABLE_LAYOUT','status:Done')]
        for name,layout,filter_query in specs:
            if name not in views:
                request={'name':name,'layout':layout.replace('_LAYOUT','').lower(),'filter':filter_query}
                if layout!='ROADMAP_LAYOUT':request['visible_fields']=[rest_field_ids[field] for field in ['Title','Status','Assignees','Sprint','Priority','Story Points','DRI','WBS','Start date','Target date','Actual Done','Evidence URL'] if field in rest_field_ids]
                if layout=='BOARD_LAYOUT':request['vertical_group_by']=[rest_field_ids['Status']]
                if name=='By Owner':request['group_by']=[rest_field_ids['Assignees']]
                created=gh('api','--method','POST',f'users/{OWNER}/projectsV2/{number}/views',*api_headers,payload=request)
                views[name]={'id':created['node_id'],'name':name,'number':created['number'],'layout':layout,'filter':filter_query}
            if views[name]['layout']!=layout or (views[name].get('filter') or '')!=filter_query:
                update={'viewId':views[name]['id'],'name':name,'layout':layout,'filter':filter_query}
                if layout!='ROADMAP_LAYOUT':update['configuration']={'visibleFieldIds':visible}
                graphql('''mutation($input:UpdateProjectV2ViewInput!){updateProjectV2View(input:$input){projectV2View{id name layout filter number}}}''',input=update)
        verified=field_state(pid)
        for view in verified['views']['nodes']:
            if view['name'] in ('Board','Sprint 1','Sprint 2') and not any(f.get('name')=='Status' for f in view['verticalGroupByFields']['nodes']):
                raise RuntimeError('Board columns are not grouped by Status')
        result.update(status='VERIFIED',items=expected,fields=list(fields),statuses=[o['name'] for o in fields['Status']['options']],views=verified['views']['nodes'],
                      burndown={'source':'actual issue events','svg_paths':['docs/project/burndown-s1.svg','docs/project/burndown-s2.svg'],'native_chart_creation_supported':False},
                      limitations=['Planned baseline dates are not actual execution dates','No pre-creation project state history is invented','Actual Start remains empty where no explicit start evidence exists','DRI is assigned work ownership, not proof of authenticated commit authorship'])
        save();print(json.dumps({'url':project['url'],'status':'VERIFIED','items':len(expected),'views':len(specs)}))
    except Exception as error:
        result['status']='FAILED';result['errors'].append(str(error));save();raise


if __name__=='__main__':
    main()
