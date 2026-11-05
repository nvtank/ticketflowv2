"""Render real-event issue-count charts; no invented historical curve or velocity."""

from datetime import timedelta
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
from project_data import OUT, timestamp


def main():
    data=json.loads((OUT/'live-data.json').read_text())
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'svg.hashsalt':'tixflow-real-events'})
    for sprint in ['S1','S2']:
        points=data['burndown'][sprint]
        fig,ax=plt.subplots(figsize=(10,4.6),layout='constrained')
        if points:
            x=[timestamp(p['timestamp']) for p in points]
            remaining=[p['remaining_issues'] for p in points]
            scope=[p['scope_issues'] for p in points]
            ax.step(x,scope,where='post',color='#9ca3af',linestyle='--',label='Issues created (actual scope)')
            ax.step(x,remaining,where='post',color='#2563eb',linewidth=2,label='Open issues remaining')
            ax.scatter([x[-1]],[remaining[-1]],color='#2563eb',s=35,zorder=3)
            ax.set_xlim(x[0]-timedelta(minutes=2),x[-1]+timedelta(minutes=2))
            ax.set_ylim(bottom=0,top=max(scope)+1)
            ax.text(.99,.04,f'Latest: {remaining[-1]} open / {scope[-1]} created',transform=ax.transAxes,ha='right')
        else:
            ax.text(.5,.5,'No observed issue events',ha='center',transform=ax.transAxes)
        planned=data['baseline'][sprint]
        ax.set_title(f'{sprint} — burndown from actual GitHub issue events\nPlanned window: {planned[0]} to {planned[1]} (plan only)',loc='left',fontweight='bold')
        ax.set_ylabel('Issue count')
        ax.set_xlabel('Actual event time (UTC); reconstructed commit dates are not used')
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%d %b\n%H:%M'))
        ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))
        ax.grid(axis='y',alpha=.2);ax.spines[['top','right']].set_visible(False)
        ax.legend(loc='upper left',frameon=False)
        fig.savefig(OUT/f'burndown-{sprint.lower()}.svg',metadata={'Date':data['observed_at']})
        svg = OUT/f'burndown-{sprint.lower()}.svg'
        svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
        fig.savefig(OUT/f'burndown-{sprint.lower()}.png',dpi=160)
        plt.close(fig)
    print('Rendered S1/S2 SVG and PNG charts from actual GitHub issue events')


if __name__=='__main__':main()
