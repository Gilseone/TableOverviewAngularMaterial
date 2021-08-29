import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TableOverviewExampleService } from './table-overview-example.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CurrencyPipe } from '@angular/common';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"

export interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  salary: number;
  isExpanded: boolean;
  isHaveDetails: boolean;
}

export interface CustomColumn {
  position: number;
  name: string;
  displayText: string;
  isActive: boolean;
}

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'table-overview-example',
  styleUrls: ['table-overview-example.css'],
  templateUrl: 'table-overview-example.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0px', visibility: 'collapse' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableOverviewExample implements AfterViewInit {
  private columns: any[] = [
    {
      name: 'expand',
      displayText: '',
      isShowHide: false,
      isPrintable: false,
    },
    {
      name: 'id',
      displayText: 'ID',
      isShowHide: true,
      isPrintable: true,
    },
    {
      name: 'name',
      displayText: 'Name',
      isShowHide: true,
      isPrintable: true,
    },
    {
      name: 'username',
      displayText: 'Username',
      isShowHide: true,
      isPrintable: true,
    },
    {
      name: 'email',
      displayText: 'E-mail',
      isShowHide: true,
      isPrintable: true,
    },
    {
      name: 'phone',
      displayText: 'Phone',
      isShowHide: true,
      isPrintable: true,
    },
    {
      name: 'salary',
      displayText: 'Salary',
      isShowHide: true,
      isPrintable: true,
    }
  ];

  public displayedColumns: string[] = this.columns.map(col => col.name);

  public dataSource: MatTableDataSource<UserData>;
  public totalSalaries: number;
  public expandedElement: UserData | null;

  public columnShowHideList: CustomColumn[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private service: TableOverviewExampleService, private cp: CurrencyPipe) { }

  ngOnInit(): void {
    // Create user data
    this.initializeColumnProperties();

    this.service.getUsers().subscribe((users) => {
      var totalSalariesTemp = 0;

      // Assign the data to the data source for the table to render
      this.dataSource = new MatTableDataSource(users);

      for (let user of this.dataSource.data) {
        user.isExpanded = false;
        user.isHaveDetails = this.getRandomBoolean();
        user.salary = this.getRandomNumber(2000, 10000);
        totalSalariesTemp += user.salary;
      }

      this.totalSalaries = totalSalariesTemp;

      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  ngAfterViewInit() {
    this.paginator.pageIndex = 0;
  }

  public expandCollapse(row: any) {
    if (row.isExpanded) {
      row.isExpanded = false;
    } else {
      row.isExpanded = true;
    }
  }

  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public getRandomNumber(min: number, max: number): number {
    return Math.random() * (max - min + 1) + min;
  }

  public getRandomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  public toggleColumn(column: CustomColumn) {
    if (column.isActive) {
      if (column.position > this.displayedColumns.length - 1) {
        this.displayedColumns.push(column.name);
      } else {
        this.displayedColumns.splice(column.position, 0, column.name);
      }
    } else {
      let i = this.displayedColumns.indexOf(column.name);
      let opr = i > -1 ? this.displayedColumns.splice(i, 1) : undefined;
    }
  }

  public initializeColumnProperties() {
    this.columns.forEach((element, index) => {
      if(element.isShowHide){
        this.columnShowHideList.push({ position: index, name: element.name, displayText: element.displayText, isActive: true });
      }
    });
  }

  public exportPdf() {
    var printHeaderData: any = [];
    var printBodyData: any = [];

    printHeaderData.push(this.columns.filter(col => col.isPrintable).map(col => col.displayText));

    this.dataSource.data.forEach(e => {
      var tempObj = [];
      tempObj.push(e.id);
      tempObj.push(e.name);
      tempObj.push(e.username);
      tempObj.push(e.email);
      tempObj.push(e.phone);
      tempObj.push(this.cp.transform(e.salary, 'USD', 'symbol', '1.2-2'));
      printBodyData.push(tempObj);
    });

    var doc = new jsPDF('p','mm',[297, 210]);
    doc.setFontSize(10);
    autoTable(doc, {
      // theme: "grid",
      margin: {horizontal: 10},
      bodyStyles: {valign: 'top'},
      styles: {overflow: 'linebreak'},
      head: printHeaderData,
      body: printBodyData,
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 20 }
      }
    });

    //Save PDF
    //doc.save('Filename.pdf')

    //Open pdf in new tab
    window.open(URL.createObjectURL(doc.output("blob")))
  }
}
